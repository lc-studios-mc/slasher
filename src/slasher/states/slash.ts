import type { SlasherState } from "../shared";
import { applyCameraShake, getFaceFrontLocation } from "@/lib/misc";
import { randomFloat } from "@/lib/number";
import * as mc from "@minecraft/server";
import { StateName } from "../shared";

const SLASH_DURATION = 0.35 * mc.TicksPerSecond;

export const SlashState: SlasherState = {
	name: StateName.Idle,

	onEnter({ s }) {
		if (s.player.getItemCooldown("slasher_slash_alt")) {
			s.player.startItemCooldown("slasher_slash_2", 2);
			s.player.startItemCooldown("slasher_slash_alt", 0);
		} else {
			s.player.startItemCooldown("slasher_slash_1", 2);
			s.player.startItemCooldown("slasher_slash_alt", 40);
		}

		s.dimension.playSound("slasher.slasher.slash", getFaceFrontLocation(s.player), {
			pitch: randomFloat(0.84, 1.03),
			volume: 1.2,
		});

		applyCameraShake(s.player, 0.1, 0.15, "rotational");
	},

	onTick({ s }) {
		if (s.fsm.currentTick < SLASH_DURATION) return;

		return StateName.Idle;
	},
};
