import type { FsmState } from "@/lib/fsm";
import type { SlasherSession } from "./session";

export const SLASHER_TYPE_ID = "slasher:slasher";

export type StateName = (typeof StateName)[keyof typeof StateName];
export const StateName = {
	Idle: "idle",
	Slash: "slash",
} as const;

export type StateContext = {
	s: SlasherSession;
};

export type SlasherState = FsmState<StateContext>;
