import * as mc from "@minecraft/server";
import * as vec3 from "./vec3";

const faceFrontLoc = vec3.create();

export function getFaceFrontLocation(entity: mc.Entity): mc.Vector3 {
	return vec3.add(faceFrontLoc, entity.getHeadLocation(), entity.getViewDirection());
}

export function applyCameraShake(
	player: mc.Player,
	intensity: number,
	seconds: number,
	type: "positional" | "rotational",
): void {
	player.runCommand(`camerashake add @s ${intensity} ${seconds} ${type}`);
}

export function stopCameraShake(player: mc.Player) {
	player.runCommand(`camerashake stop @s`);
}

export function isCreativeOrSpectator(player: mc.Player): boolean {
	const gameMode = player.getGameMode();
	return gameMode === mc.GameMode.Creative || gameMode === mc.GameMode.Spectator;
}
