"use client";



import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { GameSelector } from "@/components/tournament/GameSelector";

import { PlanLimitBanner } from "@/components/judge/PlanLimitBanner";

import { FeatureGate } from "@/components/premium/FeatureGate";

import { usePlanGate } from "@/hooks/usePlanGate";

import { useUpgradeModal } from "@/components/premium/UpgradeModalProvider";

import { useSubscription } from "@/hooks/useSubscription";

import { getGameAdapter, type GameCode } from "@/lib/tcg-adapters";

import { useCreateTournament, useGameFormats } from "@/hooks/useTournamentGames";

import { useAnalytics } from "@/hooks/useAnalytics";



export function TournamentCreateForm() {

  const router = useRouter();

  const { track } = useAnalytics();

  const { features } = useSubscription();

  const tournamentGate = usePlanGate("torneios");

  const { showUpgrade } = useUpgradeModal();

  const [step, setStep] = useState<1 | 2>(1);

  const [gameCode, setGameCode] = useState<GameCode | null>(null);

  const [formatCode, setFormatCode] = useState("");

  const [name, setName] = useState("");

  const [timerMinutes, setTimerMinutes] = useState(50);

  const [matchType, setMatchType] = useState("BO3");



  const { data: formats } = useGameFormats(gameCode);

  const createMutation = useCreateTournament();



  const adapter = gameCode ? getGameAdapter(gameCode) : null;

  const selectedFormat = formats?.find((f) => f.code === formatCode);



  useEffect(() => {

    if (selectedFormat) {

      setTimerMinutes(selectedFormat.default_timer_minutes);

      setMatchType(selectedFormat.default_match_type);

    }

  }, [selectedFormat]);



  const blocked = !features.tournament_creation || tournamentGate.showGate;



  const handleSubmit = async () => {

    if (!gameCode || !formatCode || !name.trim()) return;

    if (blocked) {

      showUpgrade("torneios");

      return;

    }

    track("tournament_create_started", { game: gameCode, format: formatCode });

    try {

      const result = await createMutation.mutateAsync({

        name: name.trim(),

        game_code: gameCode,

        format_code: formatCode,

        timer_minutes: timerMinutes,

        match_type: matchType,

      });

      track("tournament_created", { game: gameCode, format: formatCode });

      router.push(`/tournament/${(result as { id: string }).id}`);

    } catch (err) {

      if (err instanceof Error && err.message.includes("Limite")) {

        showUpgrade("torneios");

      }

    }

  };



  if (blocked && !features.tournament_creation) {

    return (

      <FeatureGate feature="tournament_creation">

        <div />

      </FeatureGate>

    );

  }



  if (blocked) {

    return <PlanLimitBanner variant="torneios" />;

  }



  if (step === 1) {

    return (

      <div className="space-y-6">

        <h2 className="text-xl font-semibold text-foreground">Selecione o Jogo</h2>

        <GameSelector

          value={gameCode}

          onChange={(code) => {

            setGameCode(code);

            setFormatCode("");

          }}

        />

        <button

          type="button"

          disabled={!gameCode}

          onClick={() => setStep(2)}

          className="rounded-lg bg-amber-500 px-6 py-3 font-semibold text-slate-900 disabled:opacity-40"

        >

          Continuar →

        </button>

      </div>

    );

  }



  return (

    <div className="space-y-6">

      <button type="button" onClick={() => setStep(1)} className="text-sm text-slate-400 hover:text-foreground">

        ← Voltar

      </button>

      <h2 className="text-xl font-semibold text-foreground">

        Configurar Torneio — {adapter?.name}

      </h2>



      <label className="block space-y-2">

        <span className="text-sm text-slate-400">Nome do torneio</span>

        <input

          value={name}

          onChange={(e) => setName(e.target.value)}

          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-foreground"

          placeholder="Ex: Liga Pokémon Lisboa — Junho"

        />

      </label>



      <label className="block space-y-2">

        <span className="text-sm text-slate-400">Formato</span>

        <select

          value={formatCode}

          onChange={(e) => setFormatCode(e.target.value)}

          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-foreground"

        >

          <option value="">Escolher formato...</option>

          {(formats ?? adapter?.supportedFormats ?? []).map((f) => (

            <option key={f.code} value={f.code}>

              {f.name}

            </option>

          ))}

        </select>

      </label>



      {formatCode && adapter && (

        <p className="rounded-lg bg-slate-800/80 p-4 text-sm text-slate-400">

          {adapter.getDecklistHint(formatCode)}

        </p>

      )}



      <div className="grid gap-4 sm:grid-cols-2">

        <label className="block space-y-2">

          <span className="text-sm text-slate-400">Timer (minutos)</span>

          <input

            type="number"

            min={10}

            max={180}

            value={timerMinutes}

            onChange={(e) => setTimerMinutes(Number(e.target.value))}

            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-foreground"

          />

        </label>

        <label className="block space-y-2">

          <span className="text-sm text-slate-400">Tipo de partida</span>

          <select

            value={matchType}

            onChange={(e) => setMatchType(e.target.value)}

            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-foreground"

          >

            <option value="BO1">BO1</option>

            <option value="BO3">BO3</option>

            <option value="BO5">BO5</option>

            <option value="FFA">FFA (Commander)</option>

          </select>

        </label>

      </div>



      <button

        type="button"

        data-testid="create-tournament-submit"

        disabled={!name.trim() || !formatCode || createMutation.isPending}

        onClick={() => void handleSubmit()}

        className="rounded-lg bg-amber-500 px-6 py-3 font-semibold text-slate-900 disabled:opacity-40"

      >

        {createMutation.isPending ? "A criar..." : "Criar Torneio"}

      </button>

    </div>

  );

}


