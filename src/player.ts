import * as mc from "@minecraft/server";

type PlayerState = {
	slasher: {};
};

const playerStates = new Map<string, PlayerState>();

export function getOrCreatePlayerState(player: mc.Player): PlayerState {
	const current = playerStates.get(player.id);
	if (current) return current;

	const state: PlayerState = {
		slasher: {},
	};

	playerStates.set(player.id, state);
	return state;
}

mc.world.afterEvents.worldLoad.subscribe(() => {
	mc.world.getAllPlayers().forEach(getOrCreatePlayerState);
});

mc.world.afterEvents.playerSpawn.subscribe((ev) => {
	if (ev.initialSpawn) getOrCreatePlayerState(ev.player);
});

mc.world.beforeEvents.playerLeave.subscribe((ev) => {
	playerStates.delete(ev.player.id);
});
