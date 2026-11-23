import * as mc from "@minecraft/server";
import { clamp } from "./number";
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

export function sphereIntersectsAABB(center: mc.Vector3, radius: number, aabb: mc.AABB): boolean {
	const { center: c, extent: e } = aabb;
	const dx = center.x - clamp(center.x, c.x - e.x, c.x + e.x);
	const dy = center.y - clamp(center.y, c.y - e.y, c.y + e.y);
	const dz = center.z - clamp(center.z, c.z - e.z, c.z + e.z);

	return dx * dx + dy * dy + dz * dz <= radius * radius;
}

export function getClosestPointOnAABB(location: mc.Vector3, aabb: mc.AABB): mc.Vector3 {
	const { center: c, extent: e } = aabb;
	return {
		x: clamp(location.x, c.x - e.x, c.x + e.x),
		y: clamp(location.y, c.y - e.y, c.y + e.y),
		z: clamp(location.z, c.z - e.z, c.z + e.z),
	};
}
