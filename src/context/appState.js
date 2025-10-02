import React from "react";
import AppContext from "./appContext";

const AppState = ({ children }) => {
    const [options, setOptions] = React.useState(false);
    const [alertModal, setAlertModal] = React.useState(false);
    const [alertTitle, setAlertTitle] = React.useState('');
    const [alertDesc, setAlertDesc] = React.useState('');
    const [alertOptions, setAlertOptions] = React.useState({});
    const [alertCallback, setAlertCallback] = React.useState();

    const showAlertModal = (title, desc, options, callback) => {
        setAlertTitle(title);
        setAlertDesc(desc);
        setAlertModal(true);
        setAlertOptions(options);
        setAlertCallback(callback);
    }

    return(
        <AppContext.Provider 
            value={{
                options, setOptions,
                alertModal, showAlertModal, setAlertModal,
                alertTitle, alertDesc, alertOptions, alertCallback
            }}
        >
            { children }
        </AppContext.Provider>
    )
}

export default AppState;
