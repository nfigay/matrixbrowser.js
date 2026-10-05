export const rowHierarchy = [
  {
    id: 'business',
    label: 'Business',
    scope: { ids: ['order', 'invoice'] },
    children: [
      {
        id: 'shared',
        label: 'Shared',
        scope: { ids: ['order'] },
        children: [
          {
            id: 'order',
            label: 'Order',
            scope: { ids: ['order'] }
          }
        ]
      }
    ]
  },
  {
    id: 'technology',
    label: 'Technology',
    scope: { ids: ['server'] },
    children: [
      {
        id: 'shared',
        label: 'Shared',
        scope: { ids: ['server'] },
        children: [
          {
            id: 'server',
            label: 'Server',
            scope: { ids: ['server'] }
          }
        ]
      }
    ]
  }
];

export const columnHierarchy = [
  {
    id: 'applications',
    label: 'Applications',
    scope: { ids: ['crm', 'erp'] },
    children: [
      { id: 'crm', label: 'CRM', scope: { ids: ['crm'] } },
      { id: 'erp', label: 'ERP', scope: { ids: ['erp'] } }
    ]
  }
];
