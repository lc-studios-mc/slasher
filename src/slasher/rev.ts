import { clamp } from "@/lib/number";
import * as mc from "@minecraft/server";

const REV_MAX = 100;

const REV_REGEN_MAX = 20;
const REV_REGEN_INTERVAL = 2;
const REV_REGEN_PAUSE = 15;

const REV_LOSS_MIN = 20;
const REV_LOSS_INTERVAL = 5;
const REV_LOSS_PAUSE = 60;

export class RevState {
	private _currentRev = 0;
	private _regenPauseTtl = 0;
	private _regenIntervalTtl = 0;
	private _lossPauseTtl = 0;
	private _lossIntervalTtl = 0;

	constructor(public readonly player: mc.Player) {}

	get currentRev() {
		return this._currentRev;
	}

	set currentRev(value) {
		this._currentRev = clamp(Math.floor(value), 0, REV_MAX);
	}

	addRev(value: number): number {
		this.currentRev += value;
		this._lossPauseTtl = REV_LOSS_PAUSE;
		this._regenPauseTtl = REV_REGEN_PAUSE;
		return this.currentRev;
	}

	consumeRev(value: number): boolean {
		if (Math.floor(value) > this.currentRev) return false;
		this.currentRev -= value;
		this._lossPauseTtl = REV_LOSS_PAUSE;
		this._regenPauseTtl = REV_REGEN_PAUSE;
		return true;
	}

	tick() {
		if (this._currentRev < REV_REGEN_MAX) {
			if (this._regenPauseTtl > 0) {
				this._regenPauseTtl--;
			} else if (this._regenIntervalTtl > 0) {
				this._regenIntervalTtl--;
			} else {
				this._currentRev++;
				if (this._currentRev < REV_REGEN_MAX) this._regenIntervalTtl = REV_REGEN_INTERVAL;
			}
		}

		if (this._currentRev > REV_LOSS_MIN) {
			if (this._lossPauseTtl > 0) {
				this._lossPauseTtl--;
			} else if (this._lossIntervalTtl > 0) {
				this._lossIntervalTtl--;
			} else {
				this._currentRev--;
				if (this._currentRev > REV_LOSS_MIN) this._lossIntervalTtl = REV_LOSS_INTERVAL;
			}
		}
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
	},
	{ entityTypes: ["minecraft:player"] },
);

mc.world.beforeEvents.playerLeave.subscribe((ev) => {
	statesByPlayer.delete(ev.player);
});

mc.system.runInterval(() => {
	for (const state of statesByPlayer.values()) state.tick();
});
