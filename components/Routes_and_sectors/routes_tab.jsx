// https://github.com/dohooo/react-native-reanimated-table
import React, { Component } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Table, Row, Rows } from 'react-native-reanimated-table';

export default class ExampleOne extends Component {
  constructor(props) {
    super(props);
    // this.state = {
    //   tableHead: ['id','name','height','grade_fr','grade_yds'],
    // }
    this.tableData = [
      {id: 1, name: 'name 1', height: 30, grade_fr: '8a', grade_yds: '8a'},
      {id: 2, name: 'name 2', height: 23, grade_fr: '8a/8b', grade_yds: '8a'},
      {id: 3, name: 'name 3', height: 34, grade_fr: '8a', grade_yds: '8a'},
      {id: 4, name: 'name 4', height: 22, grade_fr: '8a/+', grade_yds: '8a'}
    ]
  }

  render() {
    const state = this.state;

      let rowData = [];
      rowData.push([
        'Num',
        'Name',
        'Height',
        'Bolts',
        'Grade FR',
      ])
      for (let j = 0; j < this.tableData.length; j += 1) {
        rowData.push([
          this.tableData[j]['id'],
          this.tableData[j]['name'],
          this.tableData[j]['height'],
          this.tableData[j]['grade_fr'],
          this.tableData[j]['grade_yds']
        ])
      }
      // console.log(rowData)

    return (
      <View style={styles.container}>
        <Table borderStyle={{borderWidth: 2, borderColor: '#c8e1ff'}}>
          {/* <Row data={state.tableHead} style={styles.head} textStyle={styles.text}/> */}
          <Rows data={rowData} textStyle={styles.text}/>
        </Table>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 30 },
  head: { height: 40, backgroundColor: '#F6D27E' },
  text: { margin: 6 }
});