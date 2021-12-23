import _ from 'underscore';
import lodashGet from 'lodash/get';
import lodashUnset from 'lodash/unset';
import lodashCloneDeep from 'lodash/cloneDeep';
import * as BankAccounts from './actions/BankAccounts';

/**
 * Get the default state for input fields in the VBA flow
 *
 * @param {Object} props
 * @param {String} fieldName
 * @param {*} defaultValue
 *
 * @returns {*}
 */
function getDefaultStateForField(props, fieldName, defaultValue = '') {
    return lodashGet(props, ['reimbursementAccountDraft', fieldName])
        || lodashGet(props, ['achData', fieldName], defaultValue);
}

/**
 * @param {Object} props
 * @returns {Object}
 */
function getErrors(props) {
    return lodashGet(props, ['reimbursementAccount', 'errors'], {});
}

/**
 * @param {Object} props
 * @param {String[]} paths
 */
function clearErrors(props, paths) {
    const errors = getErrors(props);
    const pathsWithErrors = _.filter(paths, path => lodashGet(errors, path, false));
    if (_.size(pathsWithErrors) === 0) {
        // No error found for this path
        return;
    }

    // Clear the existing errors
    const newErrors = lodashCloneDeep(errors);
    _.forEach(pathsWithErrors, path => lodashUnset(newErrors, path));
    BankAccounts.setBankAccountFormValidationErrors(newErrors);
}

/**
 * @param {Object} props
 * @param {String} path
 */
function clearError(props, path) {
    clearErrors(props, [path]);
}

/**
 * @param {Object} props
 * @param {Object} errorTranslationKeys
 * @param {String} inputKey
 * @returns {String}
 */
function getErrorText(props, errorTranslationKeys, inputKey) {
    const errors = getErrors(props);
    return errors[inputKey] ? props.translate(errorTranslationKeys[inputKey]) : '';
}

export {
    getDefaultStateForField,
    getErrors,
    clearError,
    clearErrors,
    getErrorText,
};
