import type { DemoScenarioConfig } from '~/types/demo'
import { byggetilladelseScenario } from './byggetilladelse'
import { klageScenario } from './klage'
import { merudgifterScenario } from './merudgifter'
import { skoleskiftScenario } from './skoleskift'

/**
 * Registry of guided demo scenarios. The hub (/demo) renders one DKFDS card
 * per entry in this order; `available: false` entries render as "kommer"
 * without a link. To add a scenario: create `./<id>.ts` exporting a
 * DemoScenarioConfig, import it here and replace its placeholder.
 */

const placeholder = (
  id: string,
  webformId: string,
  difficulty: DemoScenarioConfig['difficulty'],
  persona: DemoScenarioConfig['persona'],
  fetched: string[],
  typed: string[],
): DemoScenarioConfig => ({
  id,
  webformId,
  path: `/demo/${id}`,
  available: false,
  difficulty,
  persona,
  titleKey: `demo.hub.scenarios.${id}.title`,
  storyKey: `demo.hub.scenarios.${id}.story`,
  introKey: `demo.hub.scenarios.${id}.intro`,
  fetchedKeys: fetched.map((k) => `demo.hub.scenarios.${id}.fetched.${k}`),
  typedKeys: typed.map((k) => `demo.hub.scenarios.${id}.typed.${k}`),
  prefillMap: [],
  form: [],
  submitBody: ({ values, sessionId }) => ({ data: { workflow_id: sessionId, ...values } }),
  outcome: { headingKey: 'demo.wizard.complete.heading', bodyKey: 'demo.wizard.complete.body' },
})

export const demoScenarios: DemoScenarioConfig[] = [
  byggetilladelseScenario,
  merudgifterScenario,
  skoleskiftScenario,
  klageScenario,
]

export function findDemoScenario(id: string): DemoScenarioConfig | undefined {
  return demoScenarios.find((s) => s.id === id)
}
