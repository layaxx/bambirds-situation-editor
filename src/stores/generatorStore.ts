import { EOPRAGenerator } from "knowledge/EOPRAGenerator"
import { ExtendedIntervalAlgebraGenerator } from "knowledge/extendedIntervalAlgebraGenerator"
import { IntervalAlgebraGenerator } from "knowledge/intervalAlgebraGenerator"
import { ReducedIntervalAlgebraGenerator } from "knowledge/reducedIntervalAlgebraGenerator"
import { RelationGenerator } from "knowledge/relationGenerator"
import { Store } from "./store"

export const relationGenerators = [
  new ReducedIntervalAlgebraGenerator() as RelationGenerator,
  new IntervalAlgebraGenerator() as RelationGenerator,
  new ExtendedIntervalAlgebraGenerator() as RelationGenerator,
  new EOPRAGenerator() as RelationGenerator,
] as const

export const generatorStore: Store<RelationGenerator> =
  new Store<RelationGenerator>(relationGenerators[0])
