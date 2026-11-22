import type { StateContext } from "./shared";
import { Fsm } from "@/lib/fsm";
import { ItemSession, registerItemSession } from "@/lib/item_session";
import * as mc from "@minecraft/server";
import { SLASHER_TYPE_ID, StateName } from "./shared";
import { IdleState } from "./states/idle";

registerItemSession(SLASHER_TYPE_ID, (ctx) => new SlasherSession(ctx));

export class SlasherSession extends ItemSession {
	readonly fsm = new Fsm<StateContext>(
		{
			[StateName.Idle]: IdleState,
		},
		StateName.Idle,
	);

	override start() {
		this.fsm.start({ s: this });
	}

	override tick() {
		this.fsm.tick({ s: this });
	}
}
