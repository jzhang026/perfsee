/*
Copyright 2022 ByteDance and/or its affiliates.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { Switch, Redirect, Route } from 'react-router'

import { staticPath } from '@perfsee/shared/routes'

import { Competitor } from './competitor'
import { CompetitorReport } from './competitor-report'

export const CompetitorRoutes = () => {
  return (
    <div style={{ padding: '0 20px' }}>
      <Switch>
        <Route exact={true} path={staticPath.project.competitor.home} component={Competitor} />
        <Route exact={true} path={staticPath.project.competitor.report} component={CompetitorReport} />
        <Redirect to={staticPath.notFound} />
      </Switch>
    </div>
  )
}
