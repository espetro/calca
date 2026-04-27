import { useCallback, useEffect, useRef, useState } from "react";
import { m } from "@/lib/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { ErrorBoundary } from "@/widgets/error-boundary";
import { useCanvas } from "@/features/canvas";
import { CanvasArea } from "@/widgets/canvas-area";
import { PromptBar, PromptLibrary } from "@/widgets/prompt-bar";
import { Toolbar } from "@/widgets/toolbar";
import { CommentInput, CommentThread } from "@/features/comments";
import { SettingsModal } from "@/features/settings";
import { WelcomeModal, TutorialTour, showWelcomeAtom, showTutorialAtom } from "@/features/onboarding";
import { useProbeModels } from "@/features/settings/hooks/use-probe-models";
import { useGenerationPipeline } from "@/features/design/hooks/use-generation-pipeline";
import { SummaryList } from "@/features/design/ui/summary-list";
import { useCommentHandlers } from "@/features/comments/hooks/use-comment-handlers";
import { useKeyboardShortcuts } from "@/widgets/keyboard-shortcuts";
import { settingsAtom, isOwnKeyAtom } from "@/features/settings/state/settings-atoms";
import { groupsAtom, resetSessionAtom, hydrateGroups } from "@/features/design/state/groups-atoms";
import { canvasImagesAtom, hydrateImages } from "@/features/design/state/images-atoms";
import {
  showResetConfirmAtom,
  toolModeAtom,
  showGitHashAtom,
  showLibraryAtom,
} from "@/features/design/state/generation-atoms";
import { useMountEffect } from "@/shared/utils/use-mount-effect";
import { exportCanvas, openImportDialog } from "@/lib/export";

export default function Home() {
  const canvas = useCanvas();
  const [settings, setSettings] = useAtom(settingsAtom);
  const isOwnKey = useAtomValue(isOwnKeyAtom);
  const probeModels = useProbeModels();


  useKeyboardShortcuts();

  const [groups, setGroups] = useAtom(groupsAtom);
  const resetSession = useSetAtom(resetSessionAtom);
  const [canvasImages, setCanvasImages] = useAtom(canvasImagesAtom);

  useMountEffect(() => {
    hydrateGroups(setGroups);
  });
  useMountEffect(() => {
    hydrateImages(setCanvasImages);
  });

  const [showResetConfirm, setShowResetConfirm] = useAtom(showResetConfirmAtom);
  const setToolMode = useSetAtom(toolModeAtom);
  const [showSettings, setShowSettings] = useState(false);
  const [showWelcome, setShowWelcome] = useAtom(showWelcomeAtom);
  const [showTutorial, setShowTutorial] = useAtom(showTutorialAtom);
  const hasCheckedOnboarding = useRef(false);
  const [showGitHash, setShowGitHash] = useAtom(showGitHashAtom);
  const [showLibrary, setShowLibrary] = useAtom(showLibraryAtom);

  useEffect(() => {
    setShowGitHash(new URLSearchParams(window.location.search).has("devMode"));
  }, [setShowGitHash]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("quickMode") === "true") {
      setSettings((prev) => ({ ...prev, quickMode: true }));
    }
  }, [setSettings]);

  useEffect(() => {
    const handler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };
    document.addEventListener("wheel", handler, { passive: false });
    return () => document.removeEventListener("wheel", handler);
  }, []);

  useEffect(() => {
    if (hasCheckedOnboarding.current) return;
    hasCheckedOnboarding.current = true;

    if (!settings.onboardingCompleted) {
      setShowWelcome(true);
    }
  }, [settings.onboardingCompleted, setShowWelcome]);

  const pipeline = useGenerationPipeline(canvas);
  const commentHandlers = useCommentHandlers(pipeline.handleRevision);

  const handleExportDesign = useCallback(() => {
    exportCanvas(groups);
  }, [groups]);

  const handleImportDesign = useCallback(() => {
    openImportDialog((importedGroups) => {
      setGroups(importedGroups);
    });
  }, [setGroups]);

  return (
    <div className="h-screen w-screen overflow-hidden relative select-none">
      <ErrorBoundary category={["calca", "web", "features", "canvas"]}>
        <CanvasArea canvas={canvas} onRemix={pipeline.handleRemix} />
      </ErrorBoundary>

      <Toolbar
        mode={useAtomValue(toolModeAtom)}
        onModeChange={setToolMode}
        scale={canvas.scale}
        offset={canvas.offset}
        onZoomIn={canvas.zoomIn}
        onZoomOut={canvas.zoomOut}
        onResetView={canvas.resetView}
        onNewSession={() => setShowResetConfirm(true)}
        onExport={handleExportDesign}
        onImport={handleImportDesign}
        isOwnKey={isOwnKey}
        model={settings.model}
        providers={settings.providers}
        hasFrames={groups.length > 0}
      />

      <PromptBar
        onSubmit={pipeline.handleGenerate}
        isGenerating={pipeline.isGenerating}
        genStatus={pipeline.genStatus}
        onCancel={() => pipeline.abortRef.current?.abort()}
      />

      <ErrorBoundary category={["calca", "web", "features", "design"]}>
        <SummaryList />
      </ErrorBoundary>

      {showGitHash && (
        <div className="fixed bottom-2 left-2 z-40 text-[9px] font-mono text-gray-400 bg-black/5 backdrop-blur-sm px-2 py-1 rounded-md select-all">
          {import.meta.env.VITE_GIT_HASH}
        </div>
      )}

      <ErrorBoundary category={["calca", "web", "features", "comments"]}>
        {commentHandlers.commentDraft && (
          <CommentInput
            position={{
              screenX: commentHandlers.commentDraft.screenX,
              screenY: commentHandlers.commentDraft.screenY,
            }}
            onSubmit={commentHandlers.handleCommentSubmit}
            onCancel={() => commentHandlers.setCommentDraft(null)}
          />
        )}

        {commentHandlers.activeComment && (
          <CommentThread
            comment={commentHandlers.activeComment}
            onClose={() => {
              commentHandlers.setActiveComment(null);
              commentHandlers.setActiveCommentIterationId(null);
            }}
            onReply={commentHandlers.handleCommentReply}
          />
        )}
      </ErrorBoundary>

      <PromptLibrary
        open={showLibrary}
        onClose={() => setShowLibrary(false)}
        onUsePrompt={(prompt) => {
          setShowLibrary(false);
          pipeline.handleGenerate(prompt);
        }}
      />

      {showSettings && (
        <ErrorBoundary category={["calca", "web", "features", "settings"]}>
          <SettingsModal
            settings={settings}
            onUpdate={(update) => setSettings((prev) => ({ ...prev, ...update }))}
            onClose={() => setShowSettings(false)}
            isOwnKey={isOwnKey}
            providers={settings.providers}
            testProvider={(config) =>
              probeModels.mutateAsync({
                apiKey: config.apiKey,
                providerType: config.apiType,
                baseURL: config.baseUrl,
              })
            }
          />
        </ErrorBoundary>
      )}

      {showResetConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowResetConfirm(false)}
          />
          <div className="relative bg-white/60 backdrop-blur-2xl rounded-2xl border border-white/60 shadow-[0_24px_80px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.7)] p-8 w-[380px] max-w-[90vw] text-center">
            <h3 className="text-[15px] font-semibold text-gray-800 mb-2">{m.dialog.resetTitle()}</h3>
            <p className="text-[13px] text-gray-500 mb-6">
              {m.dialog.resetDescription()}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="text-[13px] font-medium text-gray-600 hover:text-gray-800 px-5 py-2.5 rounded-xl hover:bg-black/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetSession();
                  canvas.resetView();
                  setShowResetConfirm(false);
                }}
                className="text-[13px] font-medium text-white bg-red-500/90 hover:bg-red-500 px-5 py-2.5 rounded-xl transition-all"
              >
                Clear Canvas
              </button>
            </div>
          </div>
        </div>
      )}

      <ErrorBoundary category={["calca", "web", "features", "onboarding"]}>
        {showWelcome && (
          <WelcomeModal
            open={showWelcome}
            onTakeTour={() => {
              setShowWelcome(false);
              setShowTutorial(true);
            }}
            onSkip={() => {
              setSettings((prev) => ({ ...prev, onboardingCompleted: true }));
              setShowWelcome(false);
            }}
          />
        )}

        {showTutorial && (
          <TutorialTour
            onComplete={() => {
              setSettings((prev) => ({ ...prev, onboardingCompleted: true }));
              setShowTutorial(false);
            }}
            hasFrames={
              groups.length > 0 &&
              groups.some((g) => g.iterations.some((i) => !i.isLoading && i.html))
            }
          />
        )}
      </ErrorBoundary>

      {!isOwnKey && !showWelcome && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 backdrop-blur-xl border border-amber-300/30 text-[12px] font-medium text-amber-700 hover:bg-amber-500/20 transition-all shadow-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            {m.banner.addApiKey()}
          </button>
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: Home,
});
