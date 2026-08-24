import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    bom_json: {
                        table: 'sys_module'
                        id: '24b7913a50fd4f38914afc245d5503ea'
                    }
                    br0: {
                        table: 'sys_script'
                        id: '5451d264bb3a49ccb7d66ac859b752d6'
                    }
                    cs0: {
                        table: 'sys_script_client'
                        id: '57e81d7b1bad4762b750575bba1ead00'
                    }
                    package_json: {
                        table: 'sys_module'
                        id: 'dc06b07b4b5846799dcdaae65c8f6b55'
                    }
                    src_server_script_ts: {
                        table: 'sys_module'
                        id: 'ebf3f550cb8d449798c6cf0ff634e3a8'
                    }
                }
            }
        }
    }
}
