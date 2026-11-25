import type { SlasherSession } from "../session";
import type { SlasherState } from "../shared";
import { applyCameraShake, getFaceFrontLocation, isCreativeOrSpectator } from "@/lib/misc";
import { clamp, randomFloat } from "@/lib/number";
import * as vec3 from "@/lib/vec3";
import * as mc from "@minecraft/server";
import { StateName } from "../shared";

export const SlamReadyState: SlasherState = {
	name: StateName.SlamReady,

	onEnter({ s }) {
		s.dimension.playSound("slasher.slasher.slam.ready", getFaceFrontLocation(s.player), {
			volume: 1.5,
			pitch: randomFloat(0.95, 1.05),
		});

		s.player.startItemCooldown("slasher_slam_ready", 2);

		s.highestSlamHeight = s.player.location.y;
	},

	onTick({ s }) {
		if (s.player.location.y > s.highestSlamHeight) {
			s.highestSlamHeight = s.player.location.y;
		}

		const yVel = s.player.getVelocity().y;

		if (yVel > -3) {
			s.player.applyImpulse({ x: 0, y: -0.13, z: 0 });
		}

		const blockBelow = s.dimension.getBlockBelow(s.player.location, {
			maxDistance: clamp(-(yVel * 1.4), 1, 3.5),
			includePassableBlocks: false,
			includeLiquidBlocks: false,
		});

		if (s.player.isOnGround || blockBelow) {
			return StateName.SlamClash;
		}
	},
};

export const SlamClashState: SlasherState = {
	name: StateName.SlamClash,

	onEnter({ s }) {
		s.player.startItemCooldown("slasher_slam_clash", 2);
		s.player.applyImpulse({ x: 0, y: -0.8, z: 0 });

		s.slamLocation = s.player.location;
		performClash(s);
	},

	onTick({ s }) {
		if (s.fsm.currentTick >= 10) return StateName.Idle;
	},
};

const STRONG_HEIGHT = 8;

function performClash(s: SlasherSession) {
	const heightDiff = s.highestSlamHeight - s.slamLocation.y;

	if (heightDiff >= STRONG_HEIGHT) {
		s.dimension.playSound("slasher.slasher.slam.clash.strong", s.slamLocation, {
			volume: 1.5,
			pitch: randomFloat(0.95, 1.05),
		});

		s.dimension.spawnEntity("slasher:slam_impact", s.slamLocation);

		applyCameraShake(s.player, 0.14, 0.3, "rotational");

		s.player.addEffect("slowness", 20, { amplifier: 1, showParticles: false });
	} else {
		s.dimension.playSound("slasher.slasher.slam.clash.weak", s.slamLocation, {
			volume: 1.5,
			pitch: randomFloat(0.95, 1.05),
		});

		s.dimension.playSound("mace.heavy_smash_ground", s.slamLocation, {
			volume: 1.2,
		});

		applyCameraShake(s.player, 0.1, 0.3, "rotational");

		s.player.addEffect("slowness", 12, { amplifier: 0, showParticles: false });
	}

	const targets = s.dimension.getEntities({
		location: s.slamLocation,
		maxDistance: heightDiff >= STRONG_HEIGHT ? Math.min(10, 4 + heightDiff / 4) : 3.4,
		excludeTypes: ["minecraft:item", "minecraft:xp_orb"],
	});

	for (const target of targets) {
		if (target === s.player) continue;

		if (target instanceof mc.Player) {
			if (!mc.world.gameRules.pvp) continue;
			if (isCreativeOrSpectator(target)) continue;
		}

		const dist = vec3.distance(target.location, s.player.location);
		const isCloseOrGrounded = target.isOnGround || dist < 2.8;

		const baseDamage = heightDiff >= STRONG_HEIGHT ? 8 + heightDiff * 1.3 : 4;
		const damage = isCloseOrGrounded ? baseDamage : baseDamage / 1.5;

		try {
			target.applyDamage(damage, {
				cause: mc.EntityDamageCause.maceSmash,
				damagingEntity: s.player,
			});
		} catch {}

		if (!target.isValid) continue;
		if (!isCloseOrGrounded) continue;

		const knockbackVec = vec3.create();
		vec3.subtract(knockbackVec, target.location, s.player.location);
		knockbackVec.y = 0;
		vec3.normalize(knockbackVec, knockbackVec);
		vec3.multiplyScalar(knockbackVec, knockbackVec, 1.1);

		try {
			target.applyKnockback(knockbackVec, 0.3);
			if (!(target instanceof mc.Player)) {
				target.addEffect("slowness", 20, { amplifier: 1 });
			}
		} catch {}
	}
}
