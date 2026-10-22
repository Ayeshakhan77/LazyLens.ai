import { useCallback, useRef, useState } from "react";
import type { AnalysisResult, ColumnProfile, ParsedCsv, QualityIssue } from "../types";
import { analyzeQuality } from "../analysis/quality";
import { runAnalysis } from "../analysis";
import { profileColumns } from "../data/profile";
import { CsvError, readCsvFile, type CsvErrorCode } from "../data/parseCsv";
import { loadSampleDataset } from "../data/sample";

export type Phase = "idle" | "loading" | "preview" | "analyzing" | "ready";

export interface UiError {
  title: string;
  message: string;
  code?: CsvErrorCode;
}

export interface AnalysisState {
  phase: Phase;
  parsed: ParsedCsv | null;
  profiles: ColumnProfile[] | null;
  quality: QualityIssue[] | null;
  analysis: AnalysisResult | null;
  error: UiError | null;
  /** Index of the pipeline stage currently running. */
  stage: number;
  sourceName: string | null;
}

export const ANALYSIS_STAGES = ["Parse", "Profile", "Statistics", "Charts"] as const;

/**
 * Small deliberate pause between stages so the progress indicator is perceivable.
 * The work itself is synchronous — this only paces the *display* of real stages, it
 * never fabricates a result.
 */
const STAGE_TRANSITION_MS = 170;

const INITIAL_STATE: AnalysisState = {
  phase: "idle",
  parsed: null,
  profiles: null,
  quality: null,
  analysis: null,
  error: null,
  stage: 0,
  sourceName: null,
};

function errorTitle(code: CsvErrorCode): string {
  switch (code) {
    case "extension":
      return "That file type isn't supported";
    case "empty":
      return "That file is empty";
    case "header-only":
      return "No data rows found";
    case "oversized":
      return "That file is too large";
    case "malformed":
      return "That CSV couldn't be parsed";
    case "read":
      return "We couldn't read that file";
    default:
      return "Something went wrong";
  }
}

export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>(INITIAL_STATE);

  // Keeps the latest state readable from callbacks without re-creating them.
  const stateRef = useRef(state);
  stateRef.current = state;
  /** Guards against a slow load overwriting a newer one (e.g. rapid re-uploads). */
  const runIdRef = useRef(0);

  const describeLoadError = useCallback((error: unknown): UiError => {
    if (error instanceof CsvError) {
      return { title: errorTitle(error.code), message: error.message, code: error.code };
    }
    return {
      title: "Something went wrong",
      message:
        "We hit an unexpected problem reading that file. Try again, or export your data as CSV and re-upload.",
    };
  }, []);

  /** Parse → profile → quality is automatic on load (PRD steps 3–4). */
  const showPreview = useCallback((parsed: ParsedCsv) => {
    const profiles = profileColumns(parsed);
    const quality = analyzeQuality({
      rowCount: parsed.rowCount,
      repairs: parsed.repairs,
      columns: profiles,
      rows: parsed.rows,
    });
    setState({
      phase: "preview",
      parsed,
      profiles,
      quality,
      analysis: null,
      error: null,
      stage: 0,
      sourceName: parsed.fileName,
    });
  }, []);

  const loadFile = useCallback(
    async (file: File) => {
      const runId = ++runIdRef.current;
      setState((current) => ({ ...current, phase: "loading", error: null }));
      try {
        const parsed = await readCsvFile(file);
        if (runIdRef.current !== runId) return;
        showPreview(parsed);
      } catch (error) {
        if (runIdRef.current !== runId) return;
        setState((current) => ({
          ...current,
          phase: current.parsed ? "preview" : "idle",
          error: describeLoadError(error),
        }));
      }
    },
    [describeLoadError, showPreview],
  );

  const loadSample = useCallback(async () => {
    const runId = ++runIdRef.current;
    setState((current) => ({ ...current, phase: "loading", error: null }));
    try {
      const parsed = await loadSampleDataset();
      if (runIdRef.current !== runId) return;
      showPreview(parsed);
    } catch (error) {
      if (runIdRef.current !== runId) return;
      setState((current) => ({
        ...current,
        phase: current.parsed ? "preview" : "idle",
        error: describeLoadError(error),
      }));
    }
  }, [describeLoadError, showPreview]);

  const analyze = useCallback(async () => {
    const parsed = stateRef.current.parsed;
    if (!parsed) return;

    const runId = ++runIdRef.current;
    setState((current) => ({ ...current, phase: "analyzing", error: null, stage: 0 }));

    const wait = () => new Promise<void>((resolve) => setTimeout(resolve, STAGE_TRANSITION_MS));
    const setStage = (stage: number) => {
      if (runIdRef.current === runId) setState((current) => ({ ...current, stage }));
    };

    await wait();
    setStage(1);
    await wait();
    setStage(2);

    const analysis = runAnalysis(parsed);

    await wait();
    setStage(3);
    await wait();

    if (runIdRef.current !== runId) return;
    setState({
      phase: "ready",
      parsed,
      profiles: analysis.columns,
      quality: analysis.quality,
      analysis,
      error: null,
      stage: ANALYSIS_STAGES.length,
      sourceName: parsed.fileName,
    });
  }, []);

  const reset = useCallback(() => {
    runIdRef.current += 1;
    setState(INITIAL_STATE);
  }, []);

  const dismissError = useCallback(() => {
    setState((current) => ({ ...current, error: null }));
  }, []);

  return {
    state,
    busy: state.phase === "loading" || state.phase === "analyzing",
    loadFile,
    loadSample,
    analyze,
    reset,
    dismissError,
  };
}
