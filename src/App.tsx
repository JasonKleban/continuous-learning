import React from 'react';
import styles from './App.module.scss';
import { List } from 'immutable';

declare const mobilenet : any;
declare const tf : any;

const consoleLineBufferSize = 20;

export const App: React.FC = () => {
    const [state, dispatch] = React.useReducer(appReducer, appInitialState);
    //const img = React.useRef<HTMLImageElement>(null);
    const videoRef = React.useRef<HTMLVideoElement>(null);

    React.useEffect(() => {
        (async () => {
            dispatch(AppActions.writeLine('Hello'));
            dispatch(AppActions.writeLine('Loading mobilenet..'));

            const mobileNetInstance = await mobilenet.load();

             // we're storing this in state because we might want it later, but
             // I can't figure out how to reference it again from updated state.
            dispatch(AppActions.setMobileNetInstance(mobileNetInstance));

            dispatch(AppActions.writeLine('Successfully loaded model'));

            const webcam = await tf.data.webcam(videoRef.current, { facingMode: 'environment' });

            while (true) {
                const img = await webcam.capture();
                const result = await mobileNetInstance.classify(img);

                dispatch(AppActions.writeLine(`I think I'm looking at a ${result[0].className} (%${(result[0].probability * 100).toFixed(2)})`));

                dispatch(AppActions.setGuess(`${result[0].className} (%${(result[0].probability * 100).toFixed(2)})`));

                // Dispose the tensor to release the memory.
                img.dispose();

                // Give some breathing room by waiting for the next animation frame to
                // fire.
                await tf.nextFrame();
              }
        })();
    }, []);

    return (
        <div className={styles.app}>
            <header className={styles.appHeader}>
                {/* <img
                    ref={img}
                    alt="something"
                    crossOrigin=""
                    src="https://i.imgur.com/JlUvsxa.jpg"
                    width="227"
                    height="227" /> */}
                <video ref={videoRef} autoPlay playsInline muted width="224" height="224"></video>
                <h2>
                    {state.guess}
                </h2>
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
    setGuess: (guess : string) =>
        ({ type: s('SET_GUESS'), guess }),
    setMobileNetInstance: (mobileNetInstance : any) =>
        ({ type: s('SET_MOBILE_NET_INSTANCE'), mobileNetInstance })
}

type AppActions =
    | ReturnType<typeof AppActions.writeLine>
    | ReturnType<typeof AppActions.setGuess>
    | ReturnType<typeof AppActions.setMobileNetInstance>;

interface AppState {
    lines: List<string>
    discardedLineCount: number
    mobileNetInstance: any
    guess: string
}

const appInitialState : AppState = {
    lines: List<string>(),
    discardedLineCount: 0,
    mobileNetInstance: undefined,
    guess: ""
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
        case 'SET_GUESS':
            return ({
                ...state,
                guess: action.guess
            });
        default:
            return state;
    }
};