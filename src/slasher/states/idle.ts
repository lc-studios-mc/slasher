import type { SlasherState } from "../shared";
import { ActionName, StateName } from "../shared";

export const IdleState: SlasherState = {
	name: StateName.Idle,

	onEnter({ s }) {
		s.processInputBuffer();
	},

	onTick({ s }) {
		s.processInputBuffer();
	},
};
