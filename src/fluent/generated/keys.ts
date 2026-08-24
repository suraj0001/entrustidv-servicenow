import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    '05c5cb434712c31016bda144846d4319': {
                        table: 'help_guidance'
                        id: '05c5cb434712c31016bda144846d4319'
                    }
                    '13dbaa6147720f1016bda144846d43ec': {
                        table: 'sys_alias'
                        id: '13dbaa6147720f1016bda144846d43ec'
                    }
                    '5645a76947ba0f1016bda144846d4328': {
                        table: 'oauth_entity_profile'
                        id: '5645a76947ba0f1016bda144846d4328'
                    }
                    'api-connection-ajax': {
                        table: 'sys_script_include'
                        id: '9eb8e19a6f2d4a3cbaf4e8830ee1ef67'
                    }
                    bom_json: {
                        table: 'sys_module'
                        id: '24b7913a50fd4f38914afc245d5503ea'
                    }
                    br0: {
                        table: 'sys_script'
                        id: '5451d264bb3a49ccb7d66ac859b752d6'
                        deleted: true
                    }
                    cs0: {
                        table: 'sys_script_client'
                        id: '57e81d7b1bad4762b750575bba1ead00'
                        deleted: true
                    }
                    d645a76947ba0f1016bda144846d4327: {
                        table: 'oauth_entity'
                        id: 'd645a76947ba0f1016bda144846d4327'
                    }
                    fe1a266d47320f1016bda144846d43de: {
                        table: 'sys_alias_templates'
                        id: 'fe1a266d47320f1016bda144846d43de'
                    }
                    idv_configuration_create_acl: {
                        table: 'sys_security_acl'
                        id: '041c0fe698584262abd14c655d3891ac'
                    }
                    idv_configuration_delete_acl: {
                        table: 'sys_security_acl'
                        id: '4d86090496164952802e9d201b7085ef'
                    }
                    idv_configuration_read_acl: {
                        table: 'sys_security_acl'
                        id: 'c6dcb1c28e374c41833e0e35e132a0b5'
                    }
                    idv_configuration_write_acl: {
                        table: 'sys_security_acl'
                        id: '67459fe5d37a4bd9afe412938066bcd0'
                    }
                    idv_verification_request_create_acl: {
                        table: 'sys_security_acl'
                        id: '6042a504dbcc46c09e35b7f8a9313109'
                    }
                    idv_verification_request_delete_acl: {
                        table: 'sys_security_acl'
                        id: 'b5dc1ce33c8247dd9468eceaf62e9ba9'
                    }
                    idv_verification_request_read_acl: {
                        table: 'sys_security_acl'
                        id: 'b8a9ae5e70d04400813dad7a058a0673'
                    }
                    idv_verification_request_write_acl: {
                        table: 'sys_security_acl'
                        id: 'addbaac3a8684e9bbfdce0f3dd051f8b'
                    }
                    package_json: {
                        table: 'sys_module'
                        id: 'dc06b07b4b5846799dcdaae65c8f6b55'
                    }
                    'src_server_admin-setup-pages_api-connection-ajax_server_js': {
                        table: 'sys_module'
                        id: 'c062adb848d344f59e344154a991b28a'
                    }
                    'src_server_admin-setup-pages_api-connection-validator_ts': {
                        table: 'sys_module'
                        id: '942bead51bb44d2d896c7457582397c7'
                    }
                    'src_server_admin-setup-pages_verification-settings-ajax_server_js': {
                        table: 'sys_module'
                        id: '33481dfdc49147a6a8e098edfbcb5af0'
                    }
                    'src_server_admin-setup-pages_verification-settings-validator_ts': {
                        table: 'sys_module'
                        id: 'fd537cd0dd7646d7983c58f372e93b3a'
                    }
                    src_server_constants_ts: {
                        table: 'sys_module'
                        id: '6152dad99db24021b260f2432abf5e21'
                    }
                    'src_server_entrust_entrust-auth-client_ts': {
                        table: 'sys_module'
                        id: '8330f597498c45b7a37b89a17bb698cb'
                    }
                    'src_server_entrust_entrust-verification-client_ts': {
                        table: 'sys_module'
                        id: '460a95738e8648008a5d40dff49bc3ff'
                    }
                    'src_server_repositories_configuration-repository_ts': {
                        table: 'sys_module'
                        id: '1538d30b51574d1ea9ecc67ca50a9891'
                    }
                    'src_server_repositories_connection-credential-repository_ts': {
                        table: 'sys_module'
                        id: 'a10c2af27e99443fbfb0968cb0305d06'
                    }
                    'src_server_repositories_source-record-repository_ts': {
                        table: 'sys_module'
                        id: '54cd225f32084b23b329f3c5eda724df'
                    }
                    'src_server_repositories_subject-user-repository_ts': {
                        table: 'sys_module'
                        id: '0bddeca8797f433db32797ec2e3d5d5d'
                    }
                    'src_server_repositories_verification-request-repository_ts': {
                        table: 'sys_module'
                        id: '00850a28f1e54f5bb803bc6488ef2d66'
                    }
                    src_server_script_ts: {
                        table: 'sys_module'
                        id: 'ebf3f550cb8d449798c6cf0ff634e3a8'
                        deleted: true
                    }
                    'src_server_services_api-connection-service_ts': {
                        table: 'sys_module'
                        id: 'ddb1af52bcf54d1dbf03edcde2ed46f1'
                    }
                    'src_server_services_verification-settings-service_ts': {
                        table: 'sys_module'
                        id: 'b8e43f020cd84213bca75de0c930d6ab'
                    }
                    'verification-settings-ajax': {
                        table: 'sys_script_include'
                        id: 'aa400554ce4c4fe5bd8df9115cf4fc18'
                    }
                }
                composite: [
                    {
                        table: 'sys_db_object'
                        id: '03533f0abee6407eaa01d99604234922'
                        key: {
                            name: 'x_entru_entrustidv_configuration'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '04db6620e83645bebdf95b633c34a484'
                        key: {
                            name: 'x_entru_entrustidv_verification_request'
                            element: 'workflow_run_id'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '062ffd4c7336429192889e3002e65442'
                        key: {
                            name: 'x_entru_entrustidv/setup-information.client'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0b784d8687274579a001f657d1ce7c4c'
                        key: {
                            name: 'x_entru_entrustidv_configuration'
                            element: 'redirect_url'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0e350d5eddf54e3d912c8c48d1450e18'
                        key: {
                            name: 'x_entru_entrustidv_configuration'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1ab94f5a37bb4319a631b16b76e0ec5c'
                        key: {
                            name: 'x_entru_entrustidv_configuration'
                            element: 'webhook_signing_secret'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '1c557ad192c14a2fbe40bfec8990cfd2'
                        key: {
                            name: 'x_entru_entrustidv_configuration'
                            element: 'webhook_signing_secret'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: '2186981736a048ec80fbbb426f307bc3'
                        key: {
                            name: 'x_entru_entrustidv.admin'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '25c64c11f2ca4dcba7a2c61ab8de42ec'
                        key: {
                            name: 'x_entru_entrustidv_verification_request'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '296d5cf4a19149999d866f946136575f'
                        key: {
                            name: 'x_entru_entrustidv_verification_request'
                            element: 'source_record'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '297c23cf0c914565b78720a857007c0f'
                        key: {
                            name: 'x_entru_entrustidv_verification_request'
                            element: 'source_table'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '2b8a8111cfd94426aae131fd8aee1847'
                        key: {
                            name: 'x_entru_entrustidv_verification_request'
                            element: 'applicant_id'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '336889e0ad5f4482869a24df156b55fd'
                        key: {
                            name: 'incident'
                            element: 'x_entru_entrustidv_verification_status'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '3376ecef237447c194beb7424d9651c5'
                        key: {
                            name: 'sn_hr_core_case'
                            element: 'x_entru_entrustidv_verification_status'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '369160a8dd174e4ca6c0314dac280368'
                        key: {
                            name: 'sn_hr_core_case'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '3f274cabf0774c74bfcba9fb9b055b21'
                        key: {
                            name: 'x_entru_entrustidv_verification_request'
                            element: 'workflow_version_id'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '400839a2f9434aa7be26e988c47e2726'
                        key: {
                            name: 'x_entru_entrustidv_configuration'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '41bf679d660d43978b43d5b69c6e1aa1'
                        key: {
                            name: 'x_entru_entrustidv_configuration'
                            element: 'link_delivery_channel'
                            language: 'en'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '44b1ae0f78ed4a96bf5a9b7b8620de67'
                        key: {
                            name: 'incident'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '45c24f74183e489885a30add27ccde50'
                        key: {
                            name: 'x_entru_entrustidv_verification_request'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '4687c01cd17d4d19855f0b9dab33012d'
                        key: {
                            name: 'sn_hr_core_case'
                            element: 'x_entru_entrustidv_verification_status'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '4c035c73aab444b1a27b786efc94638d'
                        key: {
                            name: 'x_entru_entrustidv_configuration'
                            element: 'workflow_id'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '4fcf333913da4197a4ca6491c175e233'
                        key: {
                            name: 'x_entru_entrustidv_configuration'
                            element: 'link_delivery_channel'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '52f008522a0945b887cf14cdfd2dd0df'
                        key: {
                            name: 'sn_hr_core_case'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '5669b29446a841c3b06ab0c45459c115'
                        key: {
                            name: 'x_entru_entrustidv_configuration'
                            element: 'link_expiry_minutes'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '59c9004accb54cc79052c1be21f12e54'
                        key: {
                            name: 'x_entru_entrustidv_verification_request'
                            element: 'source_record'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '62fd0bb7c1c14b8d9550579fdfac58f1'
                        key: {
                            name: 'x_entru_entrustidv_verification_request'
                            element: 'workflow_id'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '6ccae9a36a244723a9a1a1d1cfe3604b'
                        key: {
                            name: 'x_entru_entrustidv_verification_request'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '73c105a51d6b4593af37f8498e14e272'
                        key: {
                            name: 'x_entru_entrustidv/verification-settings.client.js.map'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7449116efc964d06a425d0a4f9bc196a'
                        key: {
                            name: 'x_entru_entrustidv_configuration'
                            element: 'region'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '79256fffe04d4295ba92a7ba03753a01'
                        key: {
                            name: 'x_entru_entrustidv_verification_request'
                            element: 'status'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ui_page'
                        id: '7afd537484054b51bfc10020f9e6b795'
                        key: {
                            endpoint: 'x_entru_entrustidv_setup_information.do'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '7f53b887758f4416ac0cb64928274c36'
                        key: {
                            sys_security_acl: 'c6dcb1c28e374c41833e0e35e132a0b5'
                            sys_user_role: {
                                id: '2186981736a048ec80fbbb426f307bc3'
                                key: {
                                    name: 'x_entru_entrustidv.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '82f8ce2a738f4684b507877024acfbfb'
                        key: {
                            name: 'incident'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '85496ec3f4714288b1278e8f27627c7b'
                        key: {
                            name: 'x_entru_entrustidv_configuration'
                            element: 'link_expiry_minutes'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: '89800af48ad44707af971f2f4c051595'
                        key: {
                            name: 'x_entru_entrustidv/api-connection.client.js.map'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '8ad4c6d2a302456bbafd3ffb0039909b'
                        key: {
                            name: 'x_entru_entrustidv_configuration'
                            element: 'region'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '9089c5837b7946bebc7ba9d81c5f6743'
                        key: {
                            sys_security_acl: 'b8a9ae5e70d04400813dad7a058a0673'
                            sys_user_role: {
                                id: '9d98b30022304913b6421a32934f1a56'
                                key: {
                                    name: 'x_entru_entrustidv.agent'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '9b3f3b3926fb4645b1b260a539058ebc'
                        key: {
                            sys_security_acl: '041c0fe698584262abd14c655d3891ac'
                            sys_user_role: {
                                id: '2186981736a048ec80fbbb426f307bc3'
                                key: {
                                    name: 'x_entru_entrustidv.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: '9d98b30022304913b6421a32934f1a56'
                        key: {
                            name: 'x_entru_entrustidv.agent'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'a351e38348304884b9107a9fa62fddbe'
                        key: {
                            name: 'x_entru_entrustidv_verification_request'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a64c4d8b45244e42adc76503ac2d8435'
                        key: {
                            name: 'x_entru_entrustidv_verification_request'
                            element: 'subject_user'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'a88ab380da224018adc3f7fafbb0d160'
                        key: {
                            name: 'x_entru_entrustidv_verification_request'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ad32ab522e164caf8f9c04f5c75d4826'
                        key: {
                            name: 'x_entru_entrustidv_configuration'
                            element: 'redirect_url'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'b7b3312fca3d47c8b03a1eef25f3635f'
                        key: {
                            name: 'sn_hr_core_case'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c16a753fac604735b030e5f15253a163'
                        key: {
                            name: 'x_entru_entrustidv_verification_request'
                            element: 'workflow_id'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c27390ae13cb475ba123b6c9ef6c3121'
                        key: {
                            name: 'incident'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c3b59f69a5a64ee6a2008759b12710d8'
                        key: {
                            name: 'x_entru_entrustidv_verification_request'
                            element: 'workflow_version_id'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'cdcfc1fa9f2f414a9cd95bfb0d6793bb'
                        key: {
                            name: 'x_entru_entrustidv/verification-settings.client'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ce12647cb6544fb9aa220edd21e330c6'
                        key: {
                            name: 'x_entru_entrustidv_verification_request'
                            element: 'applicant_id'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'd0585be89f9f4adca98a843d7e16d2d0'
                        key: {
                            sys_security_acl: '67459fe5d37a4bd9afe412938066bcd0'
                            sys_user_role: {
                                id: '2186981736a048ec80fbbb426f307bc3'
                                key: {
                                    name: 'x_entru_entrustidv.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'd11a49f98d014b5b996986dbab222fee'
                        key: {
                            sys_security_acl: 'b8a9ae5e70d04400813dad7a058a0673'
                            sys_user_role: {
                                id: '2186981736a048ec80fbbb426f307bc3'
                                key: {
                                    name: 'x_entru_entrustidv.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'dfe90df8c92c4440aed84010d9f48ce1'
                        key: {
                            name: 'x_entru_entrustidv_verification_request'
                            element: 'workflow_run_id'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e3883c6181fb409eae834a6bd9b1992d'
                        key: {
                            name: 'x_entru_entrustidv_verification_request'
                            element: 'source_table'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e461a591faf047708733e7dd0e7e2bcc'
                        key: {
                            name: 'x_entru_entrustidv_verification_request'
                            element: 'subject_user'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'e8106006b3584700b7211fea4ae9efcf'
                        key: {
                            name: 'x_entru_entrustidv/api-connection.client'
                        }
                    },
                    {
                        table: 'sys_ux_lib_asset'
                        id: 'ee94b9dd6cac49e69409c9964b48c3fe'
                        key: {
                            name: 'x_entru_entrustidv/setup-information.client.js.map'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f35ae7c45d3545f187fc1da85a50a76f'
                        key: {
                            name: 'incident'
                            element: 'x_entru_entrustidv_verification_status'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'f57b443126bb443f8e806b7b5bbfe1ee'
                        key: {
                            name: 'x_entru_entrustidv_configuration'
                        }
                    },
                    {
                        table: 'sys_ui_page'
                        id: 'f5e101c158f94be99dfe33078ef2e63d'
                        key: {
                            endpoint: 'x_entru_entrustidv_verification_settings_setup.do'
                        }
                    },
                    {
                        table: 'sys_ui_page'
                        id: 'f9aadf44ee9d4365aaef10f48c9f8289'
                        key: {
                            endpoint: 'x_entru_entrustidv_entrust_api_connection_setup.do'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'fe032b9b274b4e0d8fda79218406aeda'
                        key: {
                            name: 'x_entru_entrustidv_configuration'
                            element: 'workflow_id'
                            language: 'en'
                        }
                    },
                ]
            }
        }
    }
}
