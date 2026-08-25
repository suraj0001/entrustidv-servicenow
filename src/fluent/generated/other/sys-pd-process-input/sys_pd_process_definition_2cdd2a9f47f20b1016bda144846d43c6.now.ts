import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['e4dde617473a0b1016bda144846d4317'],
    table: 'sys_pd_process_input',
    data: {
        active: 'true',
        array: 'false',
        array_denormalized: 'false',
        attributes: 'element_mapping_provider=com.snc.pd.designer.elementmapping.PlaybookInputElementMapper',
        audit: 'false',
        calculation: `(function calculatedFieldValue(current) {

	// Add your code here
	return '';  // return the calculated value

})(current);`,
        column_label: 'Parent Record',
        display: 'false',
        dynamic_creation: 'false',
        element: 'parent_record',
        element_reference: 'false',
        function_field: 'false',
        internal_type: 'reference',
        label: 'Parent Record',
        mandatory: 'false',
        max_length: '32',
        model: '2cdd2a9f47f20b1016bda144846d43c6',
        model_id: '2cdd2a9f47f20b1016bda144846d43c6',
        name: 'var__m_sys_pd_process_input_2cdd2a9f47f20b1016bda144846d43c6',
        order: '0',
        primary: 'false',
        read_only: 'false',
        reference: 'help_user_interaction',
        reference_floats: 'false',
        spell_check: 'false',
        staged: 'false',
        table_reference: 'false',
        text_index: 'false',
        unique: 'false',
        use_dependent_field: 'false',
        use_dynamic_default: 'false',
        use_reference_qualifier: 'simple',
        virtual: 'false',
        virtual_type: 'script',
        xml_view: 'false',
    },
})
