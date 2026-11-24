import type { SlasherSession } from "../session";
import type { SlasherState } from "../shared";
import { getFaceFrontLocation } from "@/lib/misc";
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
			includePassableBlocks: false,
			includeLiquidBlocks: false,
		});

		if (s.player.isOnGround) {
			s.slamLocation = s.player.location;
			return StateName.SlamClash;
		}
	},
};

export const SlamClashState: SlasherState = {
	name: StateName.SlamClash,

	onEnter({ s }) {
		s.player.startItemCooldown("slasher_slam_clash", 2);

		s.player.applyImpulse({ x: 0, y: -0.8, z: 0 });

		s.player.addEffect("slowness", 14, { amplifier: 0, showParticles: false });

		s.dimension.playSound("slasher.slasher.slam.clash_start", s.slamLocation, {
			volume: 1.2,
		});
	},

	onTick({ s }) {
		if (s.fsm.currentTick === 0) {
			performClash(s);
		}

		if (s.fsm.currentTick >= 8) return StateName.Idle;
	},
};

function performClash(s: SlasherSession) {
	const heightDiff = s.highestSlamHeight - s.player.location.y;

	if (heightDiff < 0.5) {
		s.dimension.playSound("mace.smash_air", s.slamLocation, { volume: 1.3 });
		return;
	}

	if (heightDiff > 4.5) {
		s.dimension.playSound("slasher.slasher.slam.clash", s.slamLocation, {
			volume: 1.7,
			pitch: heightDiff > 30 ? 0.77 : heightDiff > 15 ? 0.85 : 1,
		});
	} else {
		s.dimension.playSound("mace.heavy_smash_ground", s.slamLocation, {
			volume: 1.4,
		});
	}

	s.player.onScreenDisplay.setActionBar(`§l§c${heightDiff.toFixed(1)}`);
}
