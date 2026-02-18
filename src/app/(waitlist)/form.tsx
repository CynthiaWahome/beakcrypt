"use client";

import { joinWaitlist } from "./actions";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import type { Response } from "~/types/response";
import { Confetti } from "~/components/ui/confetti";
import { Check, AlertTriangle } from "lucide-react";
import { ButtonGroup } from "~/components/ui/button-group";
import { useActionState, useRef, useState } from "react";

const initialState: Response<string, { email: string }> = {
  timestamp: Date.now(),
  error: "",
  inputs: {
    email: "",
  },
};

export default function WaitlistForm() {
  const emailRef = useRef<HTMLInputElement>(null);
  const [state, formAction, pending] = useActionState(
    joinWaitlist,
    initialState,
  );
  const [showError, setShowError] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [prevTimestamp, setPrevTimestamp] = useState(state.timestamp);

  const hasSuccess = "message" in state && !!state.message;
  const hasError = "error" in state && !!state.error;

  const errorTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  if (state.timestamp !== prevTimestamp) {
    setPrevTimestamp(state.timestamp);
    if (hasError) {
      setShowError(true);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setShowError(false), 3000);
    }
  }

  const errorMessage = hasError
    ? Array.isArray(state.error)
      ? state.error[0]
      : state.error
    : null;

  const handleInputChange = () => {
    if (showError) {
      setShowError(false);
    }
  };

  const handleSubmit = () => {
    if (emailRef.current) {
      setPendingEmail(emailRef.current.value);
    }
  };

  if (hasSuccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 w-full min-h-18">
        <Confetti
          className="pointer-events-none fixed inset-0 z-100 w-full h-full"
          options={{
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          }}
        />
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-300">
          <Check className="w-5 h-5 text-emerald-400" strokeWidth={2.5} />
          <span className="text-sm text-emerald-300 font-medium">
            {state.message}
          </span>
        </div>
      </div>
    );
  }

  return (
    <form
      key={hasError && "timestamp" in state ? state.timestamp : undefined}
      action={formAction}
      onSubmit={handleSubmit}
      className={`flex flex-col items-center gap-2 w-full self-center justify-center transition-all duration-300 ${
        showError ? "animate-shake" : ""
      }`}
    >
      {pending ? (
        <div className="flex items-center justify-center min-h-10 w-full max-w-xs">
          <span className="text-sm text-white/70 animate-pulse">
            Adding{" "}
            <span className="text-white font-medium">
              {pendingEmail || state.inputs.email}
            </span>{" "}
            to vault...
          </span>
        </div>
      ) : (
        <>
          <ButtonGroup className="w-full self-center items-center justify-center">
            <Input
              ref={emailRef}
              required
              name="email"
              id="email"
              type="email"
              className={`w-full max-w-xs transition-all duration-200 ${
                showError
                  ? "border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20"
                  : ""
              }`}
              placeholder="Enter your email"
              defaultValue={state.inputs.email}
              aria-invalid={showError}
              aria-describedby={showError ? "email-error" : undefined}
              onChange={handleInputChange}
            />
            <Button
              variant="outline"
              type="submit"
              className="min-w-22.5 transition-all duration-200"
            >
              Submit
            </Button>
          </ButtonGroup>

          {showError && errorMessage && (
            <div
              id="email-error"
              role="alert"
              className="flex items-center gap-2 text-sm text-red-400 animate-in fade-in slide-in-from-top-1 duration-200"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!showError && (
            <span className="text-xs text-white/50">
              No spam, Unsubscribe anytime
            </span>
          )}
        </>
      )}
    </form>
  );
}
