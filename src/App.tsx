import * as React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  StatusBar,
  Button,
  Platform,
  Text,
  ActivityIndicator,
} from 'react-native';
import SpInAppUpdates, {
  NeedsUpdateResponse,
  IAUUpdateKind,
  StartUpdateOptions,
  StatusUpdateEvent,
  AndroidInstallStatus,
} from 'sp-react-native-in-app-updates';
import DeviceInfo from 'react-native-device-info';

const BUTTON_COLOR = '#46955f';

const HIGH_PRIORITY_UPDATE = 5; // Arbitrary, depends on how you handle priority in the Play Console

const appVersion = DeviceInfo.getVersion();

interface AppProps {}

const App = (props: AppProps) => {
  const [needsUpdate, setNeedsUpdate] = React.useState<boolean>(false);
  const [otherData, setOtherData] = React.useState<
    NeedsUpdateResponse | undefined
  >(undefined);
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  let inAppUpdates: SpInAppUpdates = new SpInAppUpdates(
    false, // debug verbosely
  );

  const checkForUpdates = () => {
    inAppUpdates
      .checkNeedsUpdate({
        curVersion: appVersion,
        // toSemverConverter: (ver: SemverVersion) => {
        //   // i.e if 400401 is the Android version, and we want to convert it to 4.4.1
        //   const androidVersionNo = parseInt(ver, 10);
        //   const majorVer = Math.trunc(androidVersionNo / 10000);
        //   const minorVerStarter = androidVersionNo - majorVer * 10000;
        //   const minorVer = Math.trunc(minorVerStarter / 100);
        //   const patchVersion = Math.trunc(minorVerStarter - minorVer * 100);
        //   return `${majorVer}.${minorVer}.${patchVersion}`;
        // },
      })
      .then((result: NeedsUpdateResponse) => {
        setNeedsUpdate(result.shouldUpdate);
        setOtherData(result);
      })
      .catch(e => {
        console.log(e);
        setError(e);
      });
  };

  const startUpdating = () => {
    if (needsUpdate) {
      setLoading(true);
      let updateOptions: StartUpdateOptions = {};
      if (Platform.OS === 'android' && otherData) {
        // @ts-expect-error TODO: Check if updatePriority exists
        if (otherData?.updatePriority >= HIGH_PRIORITY_UPDATE) {
          updateOptions = {
            updateType: IAUUpdateKind.IMMEDIATE,
          };
        } else {
          updateOptions = {
            updateType: IAUUpdateKind.FLEXIBLE,
          };
        }
      }
      inAppUpdates.addStatusUpdateListener(onStatusUpdate);
      inAppUpdates.startUpdate(updateOptions);
    } else {
      // @ts-ignore
      alert('doesnt look like we need an update');
    }
  };

  const onStatusUpdate = (event: StatusUpdateEvent) => {
    // const {
    //   // status,
    //   bytesDownloaded,
    //   totalBytesToDownload,
    // } = status;
    // do something
    console.log(`@@ ${JSON.stringify(event)}`);
    if (event.status === 11) {
      setLoading(false);
    }
  };

  let statusTxt;
  if (needsUpdate) {
    statusTxt = 'YES';
  } else if (needsUpdate === false) {
    statusTxt = 'NO';
  } else if (error) {
    statusTxt = 'Error, check below';
  } else {
    statusTxt = 'Not sure yet';
  }

  return (
    <SafeAreaView style={{flex: 1}}>
      <View style={styles.container}>
        <View style={styles.aButton}>
          <Button
            title={'Check for updates'}
            color={BUTTON_COLOR}
            onPress={checkForUpdates}
          />
        </View>
        <View style={styles.aButton}>
          <Button
            disabled={!needsUpdate}
            title={'Start Updating'}
            color={BUTTON_COLOR}
            onPress={startUpdating}
          />
        </View>
        <View style={{alignItems: 'center'}}>
          <Text
            style={
              styles.textStyle
            }>{`Needs update: ${'\n'}${statusTxt}`}</Text>
        </View>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTextStyle}>{`Error: ${error}`}</Text>
          </View>
        ) : null}
      </View>
      {loading && (
        <ActivityIndicator
          style={styles.loading}
          color={'blue'}
          size={'large'}
        />
      )}
    </SafeAreaView>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    height: '100%',
    backgroundColor: '#77464C',
    justifyContent: 'center',
  },
  aButton: {
    marginVertical: 25,
    borderRadius: 8,
    marginHorizontal: 50,
  },
  textStyle: {
    color: '#d09a9a',
    fontSize: 26,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: 'red',
  },
  errorTextStyle: {
    color: 'black',
    fontSize: 14,
  },
  loading: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'white',
  },
});
