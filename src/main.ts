import * as mc from "@minecraft/server";

type PlayerState = {
	slasher: {};
};

const playerStates = new Map<mc.Player, PlayerState>();

function getOrCreatePlayerState(player: mc.Player): PlayerState {
	const current = playerStates.get(player);
	if (current) return current;

	const state: PlayerState = {
		slasher: {},
	};

	playerStates.set(player, state);
	return state;
}

mc.world.afterEvents.worldLoad.subscribe(() => {
	mc.world.getAllPlayers().forEach(getOrCreatePlayerState);
});

mc.world.afterEvents.playerSpawn.subscribe((ev) => {
	if (ev.initialSpawn) getOrCreatePlayerState(ev.player);
});

mc.world.beforeEvents.playerLeave.subscribe((ev) => {
	playerStates.delete(ev.player);
});

const SLASHER_TYPE_ID = "slasher:slasher";

const SlasherItemComponent: mc.ItemCustomComponent = {
	onBeforeDurabilityDamage(arg) {
		arg.durabilityDamage = 0;
	},
};

mc.system.beforeEvents.startup.subscribe((ev) => {
	ev.itemComponentRegistry.registerCustomComponent(SLASHER_TYPE_ID, SlasherItemComponent);
});

// disable vanilla attack damage by slasher
mc.world.beforeEvents.entityHurt.subscribe((ev) => {
	if (ev.damageSource.cause !== mc.EntityDamageCause.entityAttack) return;
	if (!(ev.damageSource.damagingEntity instanceof mc.Player)) return;

	const damagingItem = ev.damageSource.damagingEntity
		?.getComponent(mc.EntityComponentTypes.Equippable)
		?.getEquipment(mc.EquipmentSlot.Mainhand);
	if (damagingItem?.typeId === SLASHER_TYPE_ID) {
		ev.cancel = true;
	}
});
