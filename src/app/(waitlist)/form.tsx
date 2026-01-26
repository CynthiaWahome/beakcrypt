"use client";

import { joinWaitlist } from "./actions";
import type { Response } from "./actions";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Confetti } from "~/components/ui/confetti";
import { Check, AlertTriangle } from "lucide-react";
import { ButtonGroup } from "~/components/ui/button-group";
import { useActionState, useEffect, useRef, useState } from "react";

const initialState: Response = {
  timestamp: Date.now(),
  error: "",
  message: "",
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

  const hasSuccess = "message" in state && !!state.message;
  const hasError = "error" in state && !!state.error;
  const errorMessage = hasError
    ? Array.isArray(state.error)
      ? state.error[0]
      : state.error
    : null;

  useEffect(() => {
    if (hasError) {
      setShowError(true);
    }
  }, [hasError, state.timestamp]);

  useEffect(() => {
    if (showError) {
      const timer = setTimeout(() => {
        setShowError(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showError]);

  const handleInputChange = () => {
    if (showError) {
      setShowError(false);
    }
  };

  if (hasSuccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 w-full min-h-[72px]">
        <Confetti
          className="pointer-events-none fixed inset-0 z-[100] w-full h-full"
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
      className={`flex flex-col items-center gap-2 w-full self-center justify-center transition-all duration-300 ${
        showError ? "animate-shake" : ""
      }`}
    >
      {pending ? (
        <div className="flex items-center justify-center min-h-[40px] w-full max-w-xs">
          <span className="text-sm text-white/70 animate-pulse">
            Adding{" "}
            <span className="text-white font-medium">
              {emailRef.current?.value ?? state.inputs.email}
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
              className="min-w-[90px] transition-all duration-200"
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
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
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
