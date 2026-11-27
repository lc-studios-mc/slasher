import { clamp } from "@/lib/number";
import * as mc from "@minecraft/server";

const REV_BASE_VALUE = 0.2; // starting value
const REV_BASE_GAIN_SPEED = 0.002; // rev to gain per tick when less than base value

export class RevState {
	private _currentRev = REV_BASE_VALUE;

	get currentRev() {
		return this._currentRev;
	}

	set currentRev(value) {
		this._currentRev = clamp(value, 0, 1);
	}

	addRev(value: number): number {
		this.currentRev += value;
		return this.currentRev;
	}

	consumeRev(value: number): boolean {
		if (value > this.currentRev) return false;
		this.currentRev -= value;
		return true;
	}
}

const statesByPlayer = new Map<mc.Player, RevState>();

function getOrCreateState(player: mc.Player): RevState {
	const existing = statesByPlayer.get(player);
	if (existing) return existing;

	const state = new RevState();
	statesByPlayer.set(player, state);
	return state;
}

export function getRevState(player: mc.Player): RevState {
	return getOrCreateState(player);
}

function onTick(_player: mc.Player, state: RevState) {
	if (state.currentRev < REV_BASE_VALUE) {
		state.currentRev = Math.min(REV_BASE_VALUE, state.currentRev + REV_BASE_GAIN_SPEED);
	}
}

mc.world.afterEvents.worldLoad.subscribe(() => {
	mc.world.getAllPlayers().forEach(getOrCreateState);
});

mc.world.afterEvents.playerSpawn.subscribe((ev) => {
	getOrCreateState(ev.player);
});

mc.world.afterEvents.entityDie.subscribe(
	(ev) => {
		statesByPlayer.delete(ev.deadEntity as mc.Player);
	},
	{ entityTypes: ["minecraft:player"] },
);

mc.world.beforeEvents.playerLeave.subscribe((ev) => {
	statesByPlayer.delete(ev.player);
});

mc.system.runInterval(() => {
	for (const [player, state] of statesByPlayer) {
		onTick(player, state);
	}
});
