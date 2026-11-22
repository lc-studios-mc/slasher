import * as mc from "@minecraft/server";

export type ItemSessionContext = {
	readonly player: mc.Player;
	readonly itemStack: mc.ItemStack;
	readonly slotIndex: number;
};

export type ItemSessionFactory = (ctx: ItemSessionContext) => ItemSession;

export abstract class ItemSession {
	constructor(private readonly ctx: ItemSessionContext) {}

	get player() {
		return this.ctx.player;
	}

	get dimension() {
		return this.ctx.player.dimension;
	}

	get itemStack() {
		return this.ctx.itemStack;
	}

	get slotIndex() {
		return this.ctx.slotIndex;
	}

	start() {}

	kill() {}

	tick() {}
}

const factoriesByTypeId = new Map<string, ItemSessionFactory>();
const sessionsByPlayer = new Map<mc.Player, ItemSession>();

export function registerItemSession(typeId: string, factory: ItemSessionFactory) {
	factoriesByTypeId.set(typeId, factory);
}

function reconcileItemSession(player: mc.Player, itemStack?: mc.ItemStack) {
	let session = sessionsByPlayer.get(player);

	itemStack =
		itemStack ??
		player
			.getComponent(mc.EntityComponentTypes.Equippable)
			?.getEquipment(mc.EquipmentSlot.Mainhand);

	const isAlive = !!player.getComponent(mc.EntityComponentTypes.Health)?.currentValue;

	if (session) {
		const invalid =
			!isAlive ||
			session.slotIndex !== player.selectedSlotIndex ||
			!itemStack ||
			session.itemStack.typeId !== itemStack.typeId;

		if (invalid) {
			try {
				session.kill();
			} finally {
				sessionsByPlayer.delete(player);
				session = undefined;
			}
		}
	}

	if (session) return;
	if (!isAlive || !itemStack || !factoriesByTypeId.has(itemStack.typeId)) return;

	const factory = factoriesByTypeId.get(itemStack.typeId)!;
	session = factory({
		player,
		itemStack,
		slotIndex: player.selectedSlotIndex,
	});
	sessionsByPlayer.set(player, session);

	session.start();
}

mc.system.runInterval(() => {
	for (const session of sessionsByPlayer.values()) {
		session.tick();
	}
});

mc.world.afterEvents.worldLoad.subscribe(() => {
	for (const player of mc.world.getAllPlayers()) {
		reconcileItemSession(player);
	}
});

mc.world.afterEvents.playerSpawn.subscribe((ev) => {
	reconcileItemSession(ev.player);
});

mc.world.afterEvents.entityDie.subscribe(
	(ev) => {
		reconcileItemSession(ev.deadEntity as mc.Player);
	},
	{ entityTypes: ["minecraft:player"] },
);

mc.world.afterEvents.playerHotbarSelectedSlotChange.subscribe((ev) => {
	reconcileItemSession(ev.player, ev.itemStack);
});

mc.world.afterEvents.playerInventoryItemChange.subscribe(
	(ev) => {
		if (ev.player.selectedSlotIndex === ev.slot) {
			reconcileItemSession(ev.player, ev.itemStack);
		}
	},
	{ ignoreQuantityChange: true, inventoryType: mc.PlayerInventoryType.Hotbar },
);

mc.world.beforeEvents.playerLeave.subscribe((ev) => {
	const session = sessionsByPlayer.get(ev.player);
	if (!session) return;
	try {
		session.kill();
	} finally {
		sessionsByPlayer.delete(ev.player);
	}
});
