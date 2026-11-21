import * as mc from "@minecraft/server";

type PlayerState = {
	slasher: {};
};

const playerStates = new Map<mc.Player, PlayerState>();

export function getOrCreatePlayerState(player: mc.Player): PlayerState {
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
