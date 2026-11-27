import { getClosestPointOnAABB, isCreativeOrSpectator, sphereIntersectsAABB } from "@/lib/misc";
import * as vec3 from "@/lib/vec3";
import * as mc from "@minecraft/server";

const excludeTypes = ["minecraft:item", "minecraft:xp_orb"];
const resolvedSphereOffsets: mc.Vector3[] = [];
const rayDir = vec3.create();

export type AttackScanConfig = {
	maxDistance: number;
	sphereOffsets: readonly mc.Vector3[];
	sphereSize: number;
	isValidTarget?: (entity: mc.Entity) => boolean;
};

export function scanForAttackTargets(attacker: mc.Player, config: AttackScanConfig): mc.Entity[] {
	const { maxDistance, sphereOffsets, sphereSize = 1, isValidTarget } = config;

	const headLocation = attacker.getHeadLocation();

	vec3.resolveLocalOffsets(
		resolvedSphereOffsets,
		headLocation,
		attacker.getRotation(),
		sphereOffsets,
	);

	const candidates = attacker.dimension.getEntities({
		location: headLocation,
		maxDistance,
		excludeTypes,
	});

	const targets: mc.Entity[] = [];
	const visibleEntities: mc.Entity[] = [];

	for (const candidate of candidates) {
		if (!candidate.isValid) continue;
		if (candidate === attacker) continue;
		if (candidate instanceof mc.Player) {
			if (!mc.world.gameRules.pvp) continue;
			if (isCreativeOrSpectator(candidate)) continue;
		}
		if (candidate.hasComponent(mc.EntityComponentTypes.Projectile)) continue;
		if (isValidTarget && !isValidTarget(candidate)) continue;

		const aabb = candidate.getAABB();
		let intersectsAabb = false;

		for (let i = 0; i < sphereOffsets.length; i++) {
			const resolved = resolvedSphereOffsets[i];
			if (!resolved) continue;
			if (sphereIntersectsAABB(resolved, sphereSize, aabb)) {
				intersectsAabb = true;
				break;
			}
		}

		if (!intersectsAabb) continue;

		if (!visibleEntities.includes(candidate)) {
			const closestPoint = getClosestPointOnAABB(headLocation, aabb);
			vec3.subtract(rayDir, closestPoint, headLocation);

			const raycastHits = attacker.dimension.getEntitiesFromRay(headLocation, rayDir, {
				type: candidate.typeId,
				maxDistance,
				includePassableBlocks: false,
				includeLiquidBlocks: false,
			});

			let isVisible = false;

			for (const hit of raycastHits) {
				visibleEntities.push(hit.entity);

				if (hit.entity === candidate) {
					isVisible = true;
					break;
				}
			}

			if (!isVisible) continue;
		}

		targets.push(candidate);
	}

	return targets;
}
