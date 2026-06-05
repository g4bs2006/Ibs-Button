export const TOKEN = 'Bearer pn_YIU6pMNVjoFgcOnN7k1keODbU3xopWeaJafXBSXE3U'

export const UNITS = {
  bueno: {
    PANEL_ID: '11c26f1f-b3cf-49a5-9bd0-d538e012474b',
    STEP_AGENDADO: '25f59a8b-027d-440c-8980-fc742db0692c',
    STEP_NAME: 'AGENDADO',
    LABELS: {
      rita:   'd0436e3f-4379-4ce2-b497-4044e9b65ab9',
      nay:    '1677a3fc-3c6f-497b-9324-e25de4d98c2d',
      gabi:   '4a4fdb8d-a6f4-4e5d-88a8-639a6deef852',
      flavia: '81d4fb9a-a41e-4a72-96d9-ff9ab3b42245',
    },
    PROFESSIONALS: [
      { id: '4881605042110464', name: 'Dra. Fernanda Borges' },
    ],
  },
  eldorado: {
    PANEL_ID: 'de790da5-1a2f-42f7-ae8e-272af4666232',
    STEP_AGENDADO: 'c3cab169-cb35-4a31-aa03-eae9bbb10f98',
    STEP_NAME: 'AGENDADO',
    LABELS: {
      rita:   '5f84df4c-097a-425c-9c1b-85c1ade00ac6',
      nay:    '6aa749a4-6e90-431b-8beb-9f6e2d009b43',
      gabi:   'ea235c5f-bd36-4be1-ba16-e35568b4d021',
      flavia: 'de59cff6-fec1-4462-a022-281043ce26c6',
    },
    PROFESSIONALS: [
      { id: '5296360903933952', name: 'Dra. Fernanda Borges' },
      { id: '4960287076188160', name: 'Dra. Wellen Leticia' },
    ],
  },
}

export const CRC_LIST = [
  { key: 'rita',   label: 'Rita' },
  { key: 'nay',    label: 'Nay' },
  { key: 'gabi',   label: 'Gabi' },
  { key: 'flavia', label: 'Flávia' },
]

export const UNIT_LIST = [
  { key: 'bueno',    label: 'Bueno' },
  { key: 'eldorado', label: 'Eldorado' },
]
