import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CaretRight, CheckCircle, CircleDashed } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Logo from "@/components/logo";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { CreateWorkspaceDialog } from "@/components/create-workspace-dialog";
import { LinkAgentDialog } from "@/components/link-agent-dialog";

const steps = [
  {
    id: "workspace",
    title: "Create your workspace",
    description:
      "Set up your workspace so teammates and agents can share memory securely.",
    completed: false,
    actionLabel: "Create workspace",
    actionHref: "#",
  },
  {
    id: "project",
    title: "Create your first project",
    description:
      "Projects keep bots, data sources, and memory policies scoped and organized.",
    completed: false,
    actionLabel: "Create project",
    actionHref: "#",
  },
  {
    id: "bot",
    title: "Link your OpenClaw agent",
    description:
      "Connect your OpenClaw agent and confirm the health check so memory starts flowing.",
    completed: false,
    actionLabel: "Link agent",
    actionHref: "#",
  },
];

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  actionLabel: string;
  actionHref: string;
}

function CircularProgress({ completed, total }: { completed: number; total: number }) {
  const progress = total > 0 ? ((total - completed) / total) * 100 : 0;
  const strokeDashoffset = 100 - progress;

  return (
    <svg className="-rotate-90 scale-y-[-1]" height="14" width="14" viewBox="0 0 14 14">
      <circle
        className="stroke-muted"
        cx="7"
        cy="7"
        fill="none"
        r="6"
        strokeWidth="2"
        pathLength="100"
      />
      <circle
        className="stroke-primary"
        cx="7"
        cy="7"
        fill="none"
        r="6"
        strokeWidth="2"
        pathLength="100"
        strokeDasharray="100"
        strokeLinecap="round"
        style={{ strokeDashoffset }}
      />
    </svg>
  );
}

function StepIndicator({ completed }: { completed: boolean }) {
  if (completed) {
    return (
      <CheckCircle
        className="mt-1 size-4.5 shrink-0 text-primary"
        weight="fill"
        aria-hidden="true"
      />
    );
  }
  return (
    <CircleDashed className="mt-1 size-5 shrink-0 text-muted-foreground/40" aria-hidden="true" />
  );
}

type Onboarding01Props = {
  workspaceCompleted?: boolean;
  projectCompleted?: boolean;
  agentConnected?: boolean;
};

export function Onboarding01({
  workspaceCompleted = false,
  projectCompleted = false,
  agentConnected = false,
}: Onboarding01Props) {
  const navigate = useNavigate();
  const [currentSteps, setCurrentSteps] = useState<OnboardingStep[]>(
    steps.map((step) =>
      step.id === "workspace" && workspaceCompleted
        ? { ...step, completed: true }
        : step.id === "project" && projectCompleted
          ? { ...step, completed: true }
          : step.id === "bot" && agentConnected
            ? { ...step, completed: true }
            : step,
    ),
  );
  const [openStepId, setOpenStepId] = useState<string | null>(() => {
    const firstIncomplete = steps.find((s) => !s.completed);
    return firstIncomplete?.id ?? steps[0]?.id ?? null;
  });
  const [isAgentConnected, setIsAgentConnected] = useState(agentConnected);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const completedCount = currentSteps.filter((s) => s.completed).length;
  const remainingCount = currentSteps.length - completedCount;
  const allComplete = currentSteps.every((step) => step.completed);

  useEffect(() => {
    if (!showFinishModal) return;
    const timeout = window.setTimeout(() => {
      void navigate({ to: "/" });
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [navigate, showFinishModal]);

  useEffect(() => {
    if (!workspaceCompleted) return;
    setCurrentSteps((prev) =>
      prev.map((step) =>
        step.id === "workspace" ? { ...step, completed: true } : step,
      ),
    );
  }, [workspaceCompleted]);

  useEffect(() => {
    if (!projectCompleted) return;
    setCurrentSteps((prev) =>
      prev.map((step) =>
        step.id === "project" ? { ...step, completed: true } : step,
      ),
    );
  }, [projectCompleted]);

  useEffect(() => {
    if (!agentConnected) return;
    setIsAgentConnected(true);
    setCurrentSteps((prev) =>
      prev.map((step) => (step.id === "bot" ? { ...step, completed: true } : step)),
    );
  }, [agentConnected]);

  const handleStepClick = (stepId: string) => {
    setOpenStepId(openStepId === stepId ? null : stepId);
  };

  const handleStepAction = (step: OnboardingStep) => {
    setCurrentSteps((prev) =>
      prev.map((s) => (s.id === step.id ? { ...s, completed: true } : s)),
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-xl">
        <div className="mb-6 flex items-center justify-center gap-2 text-sm font-semibold tracking-[0.3em] text-foreground">
          <Logo className="h-6 w-auto" />
          ORCA MEMORY
        </div>
        <div className="w-xl border border-dashed bg-card p-4 text-card-foreground shadow-xs">
          <div className="mb-4 mr-2 flex flex-col justify-between sm:flex-row sm:items-center">
            <h3 className="ml-2 font-semibold text-foreground">Let’s get you set up</h3>
            <div className="mt-2 flex items-center justify-end sm:mt-0">
              <CircularProgress completed={remainingCount} total={currentSteps.length} />
              <div className="ml-1.5 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{remainingCount}</span> out of{" "}
                <span className="font-medium text-foreground">{currentSteps.length} steps</span>{" "}
                left
              </div>
            </div>
          </div>

          <div className="space-y-0">
            {currentSteps.map((step, index) => {
              const isOpen = openStepId === step.id;
              const isFirst = index === 0;
              const prevStep = currentSteps[index - 1];
              const isPrevOpen = prevStep && openStepId === prevStep.id;

              const showBorderTop = !isFirst && !isOpen && !isPrevOpen;

              return (
                <div
                  key={step.id}
                  className={cn("group", showBorderTop && "border-t border-border")}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleStepClick(step.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleStepClick(step.id);
                      }
                    }}
                    className={cn(
                      "block w-full cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    )}
                  >
                    <div
                      className={cn(
                        "relative overflow-hidden transition-colors",
                        isOpen && "border border-border bg-muted",
                      )}
                    >
                      <div className="relative flex items-center justify-between gap-3 py-3 pl-4 pr-2">
                        <div className="flex w-full gap-3">
                          <div className="shrink-0">
                            <StepIndicator completed={step.completed} />
                          </div>
                          <div className="mt-0.5 grow">
                            <h4
                              className={cn(
                                "font-semibold",
                                step.completed ? "text-primary" : "text-foreground",
                              )}
                            >
                              {step.title}
                            </h4>
                            <div
                              className={cn(
                                "overflow-hidden transition-all duration-200",
                                isOpen ? "h-auto opacity-100" : "h-0 opacity-0",
                              )}
                            >
                              <p className="mt-2 text-sm text-muted-foreground sm:max-w-64 md:max-w-xs">
                                {step.description}
                              </p>
                              {step.id === "workspace" ? (
                                <div
                                  className="mt-3"
                                  onClick={(event) => event.stopPropagation()}
                                  onKeyDown={(event) => event.stopPropagation()}
                                  role="presentation"
                                >
                                  <CreateWorkspaceDialog
                                    onCreated={() => handleStepAction(step)}
                                  />
                                </div>
                              ) : step.id === "project" ? (
                                <div
                                  className="mt-3"
                                  onClick={(event) => event.stopPropagation()}
                                  onKeyDown={(event) => event.stopPropagation()}
                                  role="presentation"
                                >
                                  <CreateProjectDialog
                                    onCreated={() => handleStepAction(step)}
                                  />
                                </div>
                              ) : step.id === "bot" ? (
                                <div
                                  className="mt-3"
                                  onClick={(event) => event.stopPropagation()}
                                  onKeyDown={(event) => event.stopPropagation()}
                                  role="presentation"
                                >
                                  <LinkAgentDialog
                                    isConnected={isAgentConnected}
                                    onConnected={() => {
                                      setIsAgentConnected(true);
                                      handleStepAction(step);
                                    }}
                                  />
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  className="mt-3"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleStepAction(step);
                                  }}
                                  asChild
                                >
                                  <a href={step.actionHref}>{step.actionLabel}</a>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                        {!isOpen && (
                          <CaretRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4">
            <Button
              type="button"
              className="w-full"
              disabled={!isAgentConnected || !allComplete}
              onClick={() => setShowFinishModal(true)}
            >
              Finish onboarding
            </Button>
          </div>
        </div>
      </div>
      <Dialog open={showFinishModal} onOpenChange={setShowFinishModal}>
        <DialogContent className="border border-dashed border-primary sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Onboarding complete</DialogTitle>
            <DialogDescription>
              You&apos;re all set. We&apos;ll take you to your dashboard in a few seconds.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
