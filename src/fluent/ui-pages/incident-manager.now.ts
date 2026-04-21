import '@servicenow/sdk/global'
import { UiPage } from '@servicenow/sdk/core'
import html from '../../client/index.html'

UiPage({
    $id: 'incident-manager-page',
    endpoint: 'x_1997678_acadreso_incident_manager.do',
    description: 'AcadResolve Incident Manager',
    category: 'general',
    html: html,
})