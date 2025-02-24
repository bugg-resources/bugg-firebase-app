import { RouteProp, useNavigation, useRoute } from '@react-navigation/core';
import { useLinkTo } from '@react-navigation/native';
import React, { memo, useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import { MainStackParamList } from '../Router';
import { TagIcon } from '../components/Icons';
import format from 'date-fns/format';
import CreateableSelect from 'react-select/creatable';

interface TagEditorPageProps {}

// The main pages have the same props, just using one as a prototype here
export type ChartsRouteProp = RouteProp<MainStackParamList, 'TagEditor'>;

//@todo temporary transformedAudioRecord data, plug in Firebase to retrive realtime data
const tempData = {
  analysesPerformed: ['two', 'three'],
  analysisId: '4000',
  audioRecordId: '987654321',
  bucket: 'bucket',
  createdAt: '2021-02-14T14:21:00Z',
  end: 400,
  hasDetections: true,
  id: '0004',
  path: 'test-path',
  project: 'none',
  recorder: 'R-2',
  start: 40,
  tags: ['Hawk', 'Tree Fall', 'Bat', 'Manatee', 'Black Caimen', 'Anaconda', 'South American Rattlesnake', 'Puma', 'Margay'],
  uri: 'some-uri'
};

function TagEditorPage(props: TagEditorPageProps) {
  let route = useRoute<ChartsRouteProp>();
  let { projectId, audioId, tag } = route.params;
  let options = tempData.tags.filter(t => t != tag).map(t => ({label: t, value: t.toLowerCase()}));
  let nav = useNavigation();
  let linkTo = useLinkTo();
  let close = useCallback(() => {
    if (nav.canGoBack()) {
      nav.goBack();
    } else {
      linkTo(`/${projectId}/charts`);
    }
  }, [nav, linkTo, projectId]);

  let [newTag, setNewTag] = useState(tag);

  // @todo creat CRUD function
  let save = ()=> {
    // myapi.save(newTag);
    close();
  };

  let cancel = ()=> {
    close();
  };

  //Handle createableSelect change
  let handleChange = (newValue: any, actionMeta: any) => {
    console.group('Value Changed');
    console.log(newValue);
    console.log(`action: ${actionMeta.action}`);
    console.groupEnd();
  };

  //Render Tag Editor
  return (
    <View style={styles.tagEditorPage}>
      <View style={styles.popup}>
        <View style={styles.header}>
          <Text style={styles.headerLeft}>
            <TagIcon width={22} colour='#30c8ba'/>
            <Text style={styles.headerLeftTxt}>
              Edit Tag
            </Text>
          </Text>
          <Text style={styles.headerCenter}>{format(new Date(tempData.createdAt), 'dd-MM-yy hh:mm')}</Text>
          <Text style={styles.headerRight}>#{tempData.audioRecordId}</Text>
        </View>
        <CreateableSelect
          isMulti
          placeholder={'Enter tag here'}
          onChange={handleChange}
          options={options}
          defaultValue={{ label: tag? tag : '', value: tag? tag.toLowerCase() : ''}}
        />
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.cancelBtn} onPress={cancel}>
            <Text style={styles.cancelBtnTxt}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={save}>
            <Text style={styles.saveBtnTxt}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tagEditorPage: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  popup: {
    backgroundColor: '#FFF',
    borderRadius: 5,
    width: '40%',
    padding: 20
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  headerLeft: {
    alignSelf: 'flex-start'
  },
  headerLeftTxt: {
      marginLeft: 5
  },
  headerCenter: {
    alignSelf: 'flex-end'
  },
  headerRight: {
    alignSelf: 'flex-end'
  },
  buttonsContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20
  },
  cancelBtn: {
    width: 75,
    backgroundColor: '#fff',
    marginHorizontal: 5,
    padding: 5,
    borderColor: '#D4DFE6',
    borderRadius: 5,
    borderWidth: 1
  },
  cancelBtnTxt: {
    textAlign: 'center'
  },
  saveBtn: {
    width: 75,
    backgroundColor: '#30c8ba',
    padding: 5,
    borderRadius: 5
  },
  saveBtnTxt: {
    textAlign: 'center',
    color: '#fff'
  },
});

export default memo(TagEditorPage);
