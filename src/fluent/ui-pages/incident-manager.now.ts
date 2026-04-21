import '@servicenow/sdk/global'
import { UiPage } from '@servicenow/sdk/core'

UiPage({
    $id: 'incident-manager-page',
    endpoint: 'x_1997678_acadreso_incident_manager.do',
    description: 'Incident Response Manager UI Page',
    category: 'general',
    direct: true,
})
