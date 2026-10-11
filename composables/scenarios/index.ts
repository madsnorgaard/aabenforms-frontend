import type { DemoScenarioConfig } from '~/types/demo'
import { byggetilladelseScenario } from './byggetilladelse'
import { klageScenario } from './klage'
import { klageFuldmagtScenario } from './klageFuldmagt'
import { merudgifterScenario } from './merudgifter'
import { skoleskiftScenario } from './skoleskift'
import { sygedagpengeScenario } from './sygedagpenge'

/**
 * Registry of guided demo scenarios. The hub (/demo) renders one DKFDS card
 * per entry in this order; `available: false` entries render as "kommer"
 * without a link. To add a scenario: create `./<id>.ts` exporting a
 * DemoScenarioConfig and add it to the list below.
 */

export const demoScenarios: DemoScenarioConfig[] = [
  byggetilladelseScenario,
  merudgifterScenario,
  skoleskiftScenario,
  klageScenario,
  klageFuldmagtScenario,
  sygedagpengeScenario,
]

export function findDemoScenario(id: string): DemoScenarioConfig | undefined {
  return demoScenarios.find((s) => s.id === id)
}
