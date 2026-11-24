import type { StateContext } from "./shared";
import { Fsm } from "@/lib/fsm";
import { InputBuffer } from "@/lib/input_buffer";
import { ItemSession, registerItemSession } from "@/lib/item_session";
import * as mc from "@minecraft/server";
import { ActionName, SLASHER_TYPE_ID, StateName } from "./shared";
import { IdleState } from "./states/idle";
import { SlamClashState, SlamWindupState } from "./states/slam";
import { SlashState } from "./states/slash";

registerItemSession(SLASHER_TYPE_ID, (ctx) => new SlasherSession(ctx));

export class SlasherSession extends ItemSession {
	readonly fsm = new Fsm<StateContext>(
		{
			[StateName.Idle]: IdleState,
			[StateName.Slash]: SlashState,
			[StateName.SlamWindup]: SlamWindupState,
			[StateName.SlamClash]: SlamClashState,
		},
		StateName.Idle,
	);

	readonly inputBuffer = new InputBuffer<ActionName>();

	override start() {
		this.fsm.start({ s: this });

		this.player.startItemCooldown("slasher_reset", 1);
	}

	override tick() {
		this.inputBuffer.prune();

		this.fsm.tick({ s: this });
	}

	override onSwing(ev: mc.PlayerSwingStartAfterEvent) {
		if (ev.swingSource !== mc.EntitySwingSource.Attack) return;

		if (this.fsm.currentState === IdleState) {
			this.fsm.changeState(StateName.Slash, { s: this });
		} else {
			this.inputBuffer.push(ActionName.Slash);
		}
	}

	processInputBuffer() {
		if (this.inputBuffer.consume(ActionName.Slash)) {
			this.fsm.changeState(StateName.Slash, { s: this });
		}
	}
}
