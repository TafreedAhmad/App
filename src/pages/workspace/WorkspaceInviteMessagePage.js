import {isEmpty} from 'lodash';
import lodashGet from 'lodash/get';
import PropTypes from 'prop-types';
import React from 'react';
import {Keyboard, View} from 'react-native';
import {withOnyx} from 'react-native-onyx';
import _ from 'underscore';
import FullPageNotFoundView from '@components/BlockingViews/FullPageNotFoundView';
import FormProvider from '@components/Form/FormProvider';
import InputWrapper from '@components/Form/InputWrapper';
import HeaderWithBackButton from '@components/HeaderWithBackButton';
import MultipleAvatars from '@components/MultipleAvatars';
import PressableWithoutFeedback from '@components/Pressable/PressableWithoutFeedback';
import ScreenWrapper from '@components/ScreenWrapper';
import Text from '@components/Text';
import TextInput from '@components/TextInput';
import withLocalize, {withLocalizePropTypes} from '@components/withLocalize';
import withNavigationFocus from '@components/withNavigationFocus';
import withThemeStyles, {withThemeStylesPropTypes} from '@components/withThemeStyles';
import useAutoFocusInput from '@hooks/useAutoFocusInput';
import compose from '@libs/compose';
import Navigation from '@libs/Navigation/Navigation';
import * as OptionsListUtils from '@libs/OptionsListUtils';
import * as PolicyUtils from '@libs/PolicyUtils';
import updateMultilineInputRange from '@libs/updateMultilineInputRange';
import * as Link from '@userActions/Link';
import * as Policy from '@userActions/Policy';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import SearchInputManager from './SearchInputManager';
import {policyDefaultProps, policyPropTypes} from './withPolicy';
import withPolicyAndFullscreenLoading from './withPolicyAndFullscreenLoading';

const personalDetailsPropTypes = PropTypes.shape({
    /** The accountID of the person */
    accountID: PropTypes.number.isRequired,

    /** The login of the person (either email or phone number) */
    login: PropTypes.string,

    /** The URL of the person's avatar (there should already be a default avatar if
  the person doesn't have their own avatar uploaded yet, except for anon users) */
    avatar: PropTypes.string,

    /** This is either the user's full name, or their login if full name is an empty string */
    displayName: PropTypes.string,
});

const propTypes = {
    /** All of the personal details for everyone */
    allPersonalDetails: PropTypes.objectOf(personalDetailsPropTypes),

    invitedEmailsToAccountIDsDraft: PropTypes.objectOf(PropTypes.number),

    /** URL Route params */
    route: PropTypes.shape({
        /** Params from the URL path */
        params: PropTypes.shape({
            /** policyID passed via route: /workspace/:policyID/invite-message */
            policyID: PropTypes.string,
        }),
    }).isRequired,

    ...policyPropTypes,
    ...withLocalizePropTypes,
    ...withThemeStylesPropTypes,
};

const defaultProps = {
    ...policyDefaultProps,
    allPersonalDetails: {},
    invitedEmailsToAccountIDsDraft: {},
};

function WorkspaceInviteMessagePage(props) {
    const {inputCallbackRef} = useAutoFocusInput();

    if (_.isEmpty(props.invitedEmailsToAccountIDsDraft)) {
        Navigation.goBack(ROUTES.WORKSPACE_INVITE.getRoute(props.route.params.policyID), true);
    }

    const saveDraft = (newDraft) => {
        Policy.setWorkspaceInviteMessageDraft(props.route.params.policyID, newDraft);
    };

    const getDefaultWelcomeNote = () =>
        props.translate('workspace.inviteMessage.welcomeNote', {
            workspaceName: props.policy.name,
        });

    const welcomeMessage = props.workspaceInviteMessageDraft || getDefaultWelcomeNote();

    const sendInvitation = () => {
        Keyboard.dismiss();
        Policy.addMembersToWorkspace(props.invitedEmailsToAccountIDsDraft, welcomeMessage, props.route.params.policyID);
        Policy.setWorkspaceInviteMembersDraft(props.route.params.policyID, {});
        SearchInputManager.searchInput = '';
        // Pop the invite message page before navigating to the members page.
        Navigation.goBack(ROUTES.HOME);
        Navigation.navigate(ROUTES.WORKSPACE_MEMBERS.getRoute(props.route.params.policyID));
    };

    /**
     * Opens privacy url as an external link
     * @param {Object} event
     */
    const openPrivacyURL = (event) => {
        event.preventDefault();
        Link.openExternalLink(CONST.PRIVACY_URL);
    };

    const validate = () => {
        const errorFields = {};
        if (_.isEmpty(props.invitedEmailsToAccountIDsDraft)) {
            errorFields.welcomeMessage = 'workspace.inviteMessage.inviteNoMembersError';
        }
        return errorFields;
    };

    const policyName = lodashGet(props.policy, 'name');

    return (
        <ScreenWrapper
            includeSafeAreaPaddingBottom={false}
            testID={WorkspaceInviteMessagePage.displayName}
        >
            <FullPageNotFoundView
                shouldShow={_.isEmpty(props.policy) || !PolicyUtils.isPolicyAdmin(props.policy) || PolicyUtils.isPendingDeletePolicy(props.policy)}
                subtitleKey={_.isEmpty(props.policy) ? undefined : 'workspace.common.notAuthorized'}
                onBackButtonPress={() => Navigation.goBack(ROUTES.SETTINGS_WORKSPACES)}
            >
                <HeaderWithBackButton
                    title={props.translate('workspace.inviteMessage.inviteMessageTitle')}
                    subtitle={policyName}
                    shouldShowGetAssistanceButton
                    guidesCallTaskID={CONST.GUIDES_CALL_TASK_IDS.WORKSPACE_MEMBERS}
                    shouldShowBackButton
                    onCloseButtonPress={() => Navigation.dismissModal()}
                    onBackButtonPress={() => Navigation.goBack(ROUTES.WORKSPACE_INVITE.getRoute(props.route.params.policyID))}
                />

                <FormProvider
                    style={[props.themeStyles.flexGrow1, props.themeStyles.ph5]}
                    formID={ONYXKEYS.FORMS.WORKSPACE_INVITE_MESSAGE_FORM}
                    validate={validate}
                    onSubmit={sendInvitation}
                    submitButtonText={props.translate('common.invite')}
                    enabledWhenOffline
                    footerContent={
                        <PressableWithoutFeedback
                            onPress={openPrivacyURL}
                            role={CONST.ACCESSIBILITY_ROLE.LINK}
                            accessibilityLabel={props.translate('common.privacy')}
                            href={CONST.PRIVACY_URL}
                            style={[props.themeStyles.mv2, props.themeStyles.alignSelfStart]}
                        >
                            <View style={[props.themeStyles.flexRow]}>
                                <Text style={[props.themeStyles.mr1, props.themeStyles.label, props.themeStyles.link]}>{props.translate('common.privacy')}</Text>
                            </View>
                        </PressableWithoutFeedback>
                    }
                >
                    <View style={[props.themeStyles.mv4, props.themeStyles.justifyContentCenter, props.themeStyles.alignItemsCenter]}>
                        <MultipleAvatars
                            size={CONST.AVATAR_SIZE.LARGE}
                            icons={OptionsListUtils.getAvatarsForAccountIDs(_.values(props.invitedEmailsToAccountIDsDraft), props.allPersonalDetails, props.invitedEmailsToAccountIDsDraft)}
                            shouldStackHorizontally
                            shouldDisplayAvatarsInRows
                            secondAvatarStyle={[props.themeStyles.secondAvatarInline]}
                        />
                    </View>
                    <View style={[props.themeStyles.mb5]}>
                        <Text>{props.translate('workspace.inviteMessage.inviteMessagePrompt')}</Text>
                    </View>
                    <View style={[props.themeStyles.mb3]}>
                        <InputWrapper
                            InputComponent={TextInput}
                            role={CONST.ACCESSIBILITY_ROLE.TEXT}
                            inputID="welcomeMessage"
                            label={props.translate('workspace.inviteMessage.personalMessagePrompt')}
                            accessibilityLabel={props.translate('workspace.inviteMessage.personalMessagePrompt')}
                            autoCompleteType="off"
                            autoCorrect={false}
                            autoGrowHeight
                            inputStyle={[props.themeStyles.verticalAlignTop]}
                            containerStyles={[props.themeStyles.autoGrowHeightMultilineInput]}
                            value={welcomeMessage}
                            onChangeText={(text) => {
                                saveDraft(text);
                            }}
                            ref={(el) => {
                                updateMultilineInputRange(el);
                                inputCallbackRef(el);
                            }}
                        />
                    </View>
                </FormProvider>
            </FullPageNotFoundView>
        </ScreenWrapper>
    );
}

WorkspaceInviteMessagePage.propTypes = propTypes;
WorkspaceInviteMessagePage.defaultProps = defaultProps;
WorkspaceInviteMessagePage.displayName = 'WorkspaceInviteMessagePage';

export default compose(
    withLocalize,
    withPolicyAndFullscreenLoading,
    withOnyx({
        allPersonalDetails: {
            key: ONYXKEYS.PERSONAL_DETAILS_LIST,
        },
        invitedEmailsToAccountIDsDraft: {
            key: ({route}) => `${ONYXKEYS.COLLECTION.WORKSPACE_INVITE_MEMBERS_DRAFT}${route.params.policyID.toString()}`,
        },
        workspaceInviteMessageDraft: {
            key: ({route}) => `${ONYXKEYS.COLLECTION.WORKSPACE_INVITE_MESSAGE_DRAFT}${route.params.policyID.toString()}`,
            selector: (draft) => (isEmpty(draft) ? '' : draft),
        },
    }),
    withNavigationFocus,
    withThemeStyles,
)(WorkspaceInviteMessagePage);
