import type { SlasherSession } from "../session";
import type { SlasherState } from "../shared";
import { applyCameraShake, getFaceFrontLocation } from "@/lib/misc";
import { clamp, randomFloat } from "@/lib/number";
import * as vec3 from "@/lib/vec3";
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

	s.dimension.playSound("slasher.slasher.slam.clash", s.slamLocation, {
		volume: 1.7,
		pitch: heightDiff > 20 ? 0.77 : heightDiff > 12 ? 0.85 : heightDiff > 5 ? 1 : 1.08,
	});

	s.dimension.spawnEntity("slasher:slam_impact", s.slamLocation);

	applyCameraShake(s.player, 0.15, 0.2, "rotational");
}
