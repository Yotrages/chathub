"use client"
import { useState, useEffect } from "react";
import footballService from "@/services/apiService";
import {
  Match,
  LeagueStanding,
  League,
  MatchDetail,
  SingleTeam,
  SinglePlayer,
  SingleTeamMatches,
  SingleCompetitionScorers,
} from "../types";

/**
 * Custom hook for fetching and updating football data with polling
 * @param dataType - Type of data to fetch ('liveMatches', 'upcomingMatches', etc.)
 * @param refreshInterval - Interval in milliseconds for polling updates
 * @param params - Optional parameters for the API call
 * @returns Object containing data, loading state, error state, and refresh function
 */
const useLiveData = <T>(
  dataType:
    | "liveMatches"
    | "upcomingMatches"
    | "leagueStandings"
    | "leagues"
    | "todayMatches"
    | "previousMatches"
    | "getSingleLeague"
    | "getSingleLeagueMatches"
    | "getSingleLeaguePrevMatches"
    | "getMatchDetails"
    | "getSingleCompetitionScorers"
    | "getSingleTeamMatches"
    | "getTeamInfo" 
    | "getSinglePlayer",
  refreshInterval: number = 60000, 
  params?: any
): {
  data: T;
  isLoading: boolean;
  error: Error | null | string;
  refresh: () => Promise<void>;
} => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null | string>(null);

  // Function to fetch data based on dataType
  const fetchData = async () => {
    try {
      let result;

      switch (dataType) {
        case "todayMatches":
          result = await footballService.getTodayMatches();
          break;
        case "liveMatches":
          result = await footballService.getLiveMatches();
          break;
        case "upcomingMatches":
          result = await footballService.getUpcomingMatches();
          break;
        case "previousMatches":
          result = await footballService.getPreviousMatches();
          break; 
        case "leagueStandings":
          if (!params?.leagueId)
            throw new Error("League ID is required for standings");
          result = await footballService.getLeagueStandings(params.leagueId);
          break;
        case "getSingleLeague":
          if (!params?.leagueId)
            throw new Error("League ID is required for single league");
          result = await footballService.getSingleLeague(params?.leagueId);
          break; 
        case "getSingleLeagueMatches":
          if (!params?.leagueId)
            throw new Error("League ID is required for single league matches");
          result = await footballService.getSingleLeagueMatches(
            params?.leagueId
          );
          break; 
        case "getMatchDetails":
          if (!params?.matchId) // ✅ Fixed parameter check
            throw new Error("Match ID is required for match details");
          result = await footballService.getMatchDetails(
            params?.matchId // ✅ Fixed parameter name
          );
          break; 
        case "getSingleLeaguePrevMatches":
          if (!params?.leagueId)
            throw new Error("League ID is required for single league matches");
          result = await footballService.getSingleLeaguePrevMatches(
            params?.leagueId
          );
          break; 
        case "getSingleCompetitionScorers":
          if (!params?.leagueId)
            throw new Error("League ID is required for single league matches");
          result = await footballService.getSingleCompetitionScorers(
            params?.leagueId
          );
          break; 
        case "getSinglePlayer":
          if (!params?.playerId)
            throw new Error("League ID is required for single league matches");
          result = await footballService.getSinglePlayer(
            params?.playerId
          );
          break; 
          case "getTeamInfo":
            if (!params?.teamId)
              throw new Error("League ID is required for single league matches");
            result = await footballService.getTeamInfo(
              params?.teamId
            );
            break; 
        case "getSingleTeamMatches":
          if (!params?.leagueId)
            throw new Error("League ID is required for single league matches");
          result = await footballService.getSingleTeamMatches(
            params?.leagueId
          );
          break; 
        case "leagues":
          result = await footballService.getLeagues();
          break;
        default:
          throw new Error(`Invalid data type: ${dataType}`);
      }

      setData(result);
      setError(null);
    } catch (err: any) {
      if (err.response) {
        setError(err.response.data.error || err.response.data.message)
      } else if (err.request) {
        setError(err.message)
      } else (
        setError("something went wrong, check your connection")
      )
      console.error(`Error fetching ${dataType}:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();

    // Set up polling interval
    const intervalId = setInterval(fetchData, refreshInterval);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [dataType, JSON.stringify(params)]);

  // Function to manually refresh data
  const refresh = async () => {
    setIsLoading(true);
    await fetchData();
  };

  return { data, isLoading, error, refresh };
}

/**
 * Specialized hook for live matches
 * @param refreshInterval - Polling interval in milliseconds
 * @returns Live matches data with loading and error states
 */
export const useLiveMatches = (refreshInterval: number = 30000) => {
  return useLiveData<Match[]>("liveMatches", refreshInterval);
}

/**
 * Specialized hook for today matches
 * @param refreshInterval - polling interval in milliseconds
 * @returns today matches data with loading and error status
 */
export const useTodayMatches = (refreshInterval: number = 30000) => {
  return useLiveData<Match[]>("todayMatches", refreshInterval);
};

/**
 * Specialized hook for upcoming matches
 * @param refreshInterval - Polling interval in milliseconds
 * @returns Upcoming matches data with loading and error states
 */
export const useUpcomingMatches = (refreshInterval: number = 300000) => {
  // 5 minutes
  return useLiveData<Match[]>("upcomingMatches", refreshInterval);
}

/**
 * Specialized hook for previous matches
 * @param refreshInterval - Polling interval in milliseconds
 * @returns Previous matches data with loading and error states
 */
export const usePreviousMatches = (refreshInterval: number = 300000) => {
  // 5 minutes
  return useLiveData<Match[]>("previousMatches", refreshInterval);
}

/**
 * Specialized hook for league standings
 * @param leagueId - ID of the league
 * @param refreshInterval - Polling interval in milliseconds
 * @returns League standings data with loading and error states
 */
export const useLeagueStandings = (
  leagueId: any,
  refreshInterval: number = 600000
) => {
  // 10 minutes
  return useLiveData<LeagueStanding[]>("leagueStandings", refreshInterval, {
    leagueId,
  });
}
/**
 * Specialized hook for league standings
 * @param leagueId - ID of the league
 * @param refreshInterval - Polling interval in milliseconds
 * @returns League standings data with loading and error states
 */
export const useTeamInfo = (
  teamId: any,
  refreshInterval: number = 600000
) => {
  // 10 minutes
  return useLiveData<SingleTeam>("getTeamInfo", refreshInterval, {
    teamId,
  });
}
/**
 * Specialized hook for league standings
 * @param leagueId - ID of the league
 * @param refreshInterval - Polling interval in milliseconds
 * @returns League standings data with loading and error states
 */
export const useSinglePlayer = (
  playerId: any,
  refreshInterval: number = 600000
) => {
  // 10 minutes
  return useLiveData<SinglePlayer>("getSinglePlayer", refreshInterval, {
    playerId,
  });
}

/**
 * Specialized hook for league standings
 * @param leagueId - ID of the league
 * @param refreshInterval - Polling interval in milliseconds
 * @returns League standings data with loading and error states
 */
export const useSingleTeamMatches = (
  leagueId: any,
  refreshInterval: number = 600000
) => {
  // 10 minutes
  return useLiveData<SingleTeamMatches>("getSingleTeamMatches", refreshInterval, {
    leagueId,
  });
}
/**
 * Specialized hook for league standings
 * @param leagueId - ID of the league
 * @param refreshInterval - Polling interval in milliseconds
 * @returns League standings data with loading and error states
 */
export const useSingleCompetitionScorers = (
  leagueId: any,
  refreshInterval: number = 600000
) => {
  // 10 minutes
  return useLiveData<SingleCompetitionScorers>("getSingleCompetitionScorers", refreshInterval, {
    leagueId,
  });
}

/**
 * Specialized hook for match details
 * @param matchId - ID of the match ✅ Fixed parameter name
 * @param refreshInterval - Polling interval in milliseconds
 * @returns Match details data with loading and error states
 */
export const useMatchDetails = (
  matchId: any, // ✅ Fixed parameter name
  refreshInterval: number = 600000
) =>  {
  // 10 minutes
  return useLiveData<MatchDetail>("getMatchDetails", refreshInterval, {
    matchId, // ✅ Fixed parameter name
  });
}

/**
 * Specialized hook for single league
 * @param leagueId - ID of the league
 * @param refreshInterval - Polling interval in milliseconds
 * @returns Single league data with loading and error states
 */
export const useSingleLeague = (
  leagueId: any,
  refreshInterval: number = 600000
) =>  {
  // 10 minutes
  return useLiveData<League>("getSingleLeague", refreshInterval, { leagueId });
}

/**
 * Specialized hook for single league matches
 * @param leagueId - ID of the league
 * @param refreshInterval - Polling interval in milliseconds
 * @returns Single league matches data with loading and error states
 */
export const useSingleLeagueMatches = (
  leagueId: any,
  refreshInterval: number = 600000
) =>  {
  // 10 minutes
  return useLiveData<Match[]>("getSingleLeagueMatches", refreshInterval, {
    leagueId,
  });
}

/**
 * Specialized hook for single league previous matches
 * @param leagueId - ID of the league
 * @param refreshInterval - Polling interval in milliseconds
 * @returns Single league previous matches data with loading and error states
 */
export const useSingleLeaguePrevMatches = (
  leagueId: any,
  refreshInterval: number = 600000
) => {
  // 10 minutes
  return useLiveData<Match[]>("getSingleLeaguePrevMatches", refreshInterval, {
    leagueId,
  });
}

/**
 * Specialized hook for leagues list
 * @param refreshInterval - Polling interval in milliseconds
 * @returns Leagues data with loading and error states
 */
export const useLeagues = (refreshInterval: number = 3600000) => {
  // 1 hour
  return useLiveData<League[]>("leagues", refreshInterval);
}

export default useLiveData;