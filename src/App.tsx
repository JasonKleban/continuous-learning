import React from 'react';
import styles from './App.module.scss';
import { List } from 'immutable';

declare const mobilenet : any;

const consoleLineBufferSize = 20;

export const App: React.FC = () => {
    const [state, dispatch] = React.useReducer(appReducer, appInitialState);
    const img = React.useRef<HTMLImageElement>(null);

    React.useEffect(() => {
        (async () => {
            dispatch(AppActions.writeLine('Hello'));
            dispatch(AppActions.writeLine('Loading mobilenet..'));

            const mobileNetInstance = await mobilenet.load();

             // we're storing this in state because we might want it later, but
             // I can't figure out how to reference it again from updated state.
            dispatch(AppActions.setMobileNetInstance(mobileNetInstance));

            dispatch(AppActions.writeLine('Successfully loaded model'));

            // should I be doing this elsewhere?  Not in the action-creator.
            // Definitely not in the reducer.
            JSON.stringify(await mobileNetInstance.classify(img.current), null, '  ').split('\n')
                .map(AppActions.writeLine).forEach(dispatch);
        })();
    }, []);

    return (
        <div className={styles.app}>
            <header className={styles.appHeader}>
                <img
                    ref={img}
                    alt="something"
                    crossOrigin=""
                    src="https://i.imgur.com/JlUvsxa.jpg"
                    width="227"
                    height="227" />
                <div className={styles.console}>
                    {state.lines.map((l, i) => <pre key={state.discardedLineCount + i}>{l}</pre>)}
                </div>
            </header>
        </div>
    );
}

// --------------

// helper to extract the specific action type name
const s = (<T extends string>(actionType : T) => actionType);

// --------------

const AppActions = {
    writeLine: (line : string) =>
        ({ type: s('WRITE_LINE'), line }),
    setMobileNetInstance: (mobileNetInstance : any) =>
        ({ type: s('SET_MOBILE_NET_INSTANCE'), mobileNetInstance })
}

type AppActions =
    | ReturnType<typeof AppActions.writeLine>
    | ReturnType<typeof AppActions.setMobileNetInstance>;

interface AppState {
    lines: List<string>
    discardedLineCount: number
    mobileNetInstance: any
}

const appInitialState : AppState = {
    lines: List<string>(),
    discardedLineCount: 0,
    mobileNetInstance: undefined
}

const appReducer = (state : AppState, action : AppActions) => {
    switch(action.type) {
        case 'WRITE_LINE':
            return state.lines.count() < consoleLineBufferSize
                ?({
                    ...state,
                    lines: state.lines.push(action.line)
                })
                :({
                    ...state,
                    lines: state.lines.shift().push(action.line),
                    discardedLineCount: state.discardedLineCount + 1
                });
        case 'SET_MOBILE_NET_INSTANCE':
            return ({
                ...state,
                mobileNetInstance: action.mobileNetInstance
            });
        default:
            return state;
    }
};