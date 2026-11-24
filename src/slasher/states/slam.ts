import type { SlasherSession } from "../session";
import type { SlasherState } from "../shared";
import { calculateReducedDamage } from "@/lib/damage";
import { applyCameraShake, getFaceFrontLocation, isCreativeOrSpectator } from "@/lib/misc";
import { clamp, randomFloat } from "@/lib/number";
import * as vec3 from "@/lib/vec3";
import * as mc from "@minecraft/server";
import { StateName } from "../shared";

export const SlamWindupState: SlasherState = {
	name: StateName.SlamWindup,

	onEnter({ s }) {
		s.dimension.playSound("slasher.slasher.slam.windup", getFaceFrontLocation(s.player), {
			pitch: randomFloat(0.95, 1.05),
			volume: 1.3,
		});

		s.player.startItemCooldown("slasher_slam_windup", 2);

		s.player.applyImpulse({
			x: 0,
			y: clamp(1 - s.player.getVelocity().y, 0, 1),
			z: 0,
		});

		s.highestSlamHeight = -999;
	},

	onTick({ s }) {
		if (s.player.location.y > s.highestSlamHeight) {
			s.highestSlamHeight = s.player.location.y;
		}

		s.player.applyImpulse({ x: 0, y: -0.1, z: 0 });

		const blockBelow = s.dimension.getBlockBelow(s.player.location, {
			maxDistance: clamp(-(s.player.getVelocity().y * 1.4), 1, 3.5),
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

		s.dimension.playSound("slasher.slasher.slam.clash_start", s.player.location, {
			volume: 1.2,
		});
	},

	onTick({ s }) {
		if (s.fsm.currentTick === 0) {
			s.slamLocation = s.player.location;
			performClash(s);
		} else if (s.fsm.currentTick < 8) {
			s.player.clearVelocity();
		}

		if (s.fsm.currentTick >= 8) return StateName.Idle;
	},
};

function performClash(s: SlasherSession) {
	const heightDiff = s.highestSlamHeight - s.slamLocation.y;

	if (heightDiff < 1.3) {
		s.dimension.playSound("mace.smash_air", s.slamLocation, { volume: 1.3 });
		return;
	}

	if (heightDiff > 5) {
		s.dimension.playSound("slasher.slasher.slam.clash", s.slamLocation, {
			volume: 1.55,
			pitch: heightDiff >= 20 ? 0.75 : heightDiff >= 10 ? 0.85 : 1,
		});

		s.dimension.spawnEntity("slasher:slam_impact", s.slamLocation);
	} else {
		s.dimension.playSound("slasher.slasher.slash_hit", s.slamLocation, {
			volume: 1.4,
		});
		s.dimension.playSound("mace.smash_ground_heavy", s.slamLocation, {
			volume: 1.4,
		});

		s.dimension.spawnParticle("minecraft:dragon_destroy_block", {
			x: s.slamLocation.x,
			y: s.slamLocation.y + 0.3,
			z: s.slamLocation.z,
		});
	}

	applyCameraShake(s.player, 0.15, 0.2, "rotational");

	const targets = s.dimension.getEntities({
		location: s.slamLocation,
		maxDistance: 4.5,
		excludeTypes: ["minecraft:item", "minecraft:xp_orb"],
	});

	for (const target of targets) {
		if (target === s.player) continue;

		if (target instanceof mc.Player) {
			if (!mc.world.gameRules.pvp) continue;
			if (isCreativeOrSpectator(target)) continue;
		}

		const isOnGround = target.isOnGround;

		try {
			target.applyDamage(4, {
				cause: mc.EntityDamageCause.maceSmash,
				damagingEntity: s.player,
			});

			if (isOnGround) {
				target.addEffect("slowness", 40, { amplifier: 1 });
				target.clearVelocity();
				target.applyImpulse({ x: 0, y: 0.4, z: 0 });
			}
		} catch {}
	}
}
