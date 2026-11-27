import { clamp } from "@/lib/number";
import * as mc from "@minecraft/server";

const REV_MAX = 100;
const REV_BASE = 20;
const REV_REGEN_INTERVAL = 3;

export class RevState {
	private _currentRev = REV_BASE;

	constructor(public readonly player: mc.Player) {
		const savedRev = this.player.getDynamicProperty("slasherRev");
		if (typeof savedRev === "number") {
			this._currentRev = savedRev;
		}
	}

	get currentRev() {
		return this._currentRev;
	}

	set currentRev(value) {
		this._currentRev = clamp(Math.floor(value), 0, REV_MAX);
		this.player.setDynamicProperty("slasherRev", value);
	}

	addRev(value: number): number {
		this.currentRev += value;
		return this.currentRev;
	}

	consumeRev(value: number): boolean {
		if (Math.floor(value) > this.currentRev) return false;
		this.currentRev -= value;
		return true;
	}
}

const statesByPlayer = new Map<mc.Player, RevState>();

function getOrCreateState(player: mc.Player): RevState {
	const existing = statesByPlayer.get(player);
	if (existing) return existing;

	const state = new RevState(player);
	statesByPlayer.set(player, state);
	return state;
}

export function getRevState(player: mc.Player): RevState {
	return getOrCreateState(player);
}

mc.world.afterEvents.worldLoad.subscribe(() => {
	mc.world.getAllPlayers().forEach(getOrCreateState);
});

mc.world.afterEvents.playerSpawn.subscribe((ev) => {
	getOrCreateState(ev.player);
});

mc.world.afterEvents.entityDie.subscribe(
	(ev) => {
		const player = ev.deadEntity as mc.Player;
		statesByPlayer.delete(player);
		player.setDynamicProperty("slasherRev", undefined);
	},
	{ entityTypes: ["minecraft:player"] },
);

mc.world.beforeEvents.playerLeave.subscribe((ev) => {
	statesByPlayer.delete(ev.player);
});

mc.system.runInterval(() => {
	for (const state of statesByPlayer.values()) {
		if (state.currentRev < REV_BASE) state.currentRev++;
	}
}, REV_REGEN_INTERVAL);
