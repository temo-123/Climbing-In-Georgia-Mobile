import React, { Component } from 'react';
import { StyleSheet, View } from 'react-native';
import { Rows } from 'react-native-reanimated-table';
import { Table } from 'react-native-reanimated-table';

export default class IceRoutesTable extends Component {
  constructor(props) {
    super(props);
    this.tableData = props.routes;
  }

  render() {
    let rowData = [];
    rowData.push(['Num', 'Name', 'Height', 'Grade']);

    for (let j = 0; j < this.props.routes.length; j++) {
      rowData.push([
        this.tableData[j]['num'],
        this.tableData[j]['name'],
        this.tableData[j]['height'],
        this.tableData[j]['grade'],
      ]);
    }

    return (
      <View style={styles.container}>
        <Table borderStyle={{ borderWidth: 2, borderColor: '#c8e1ff' }}>
          <Rows data={rowData} textStyle={styles.text} />
        </Table>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  text: {
    margin: 6,
  },
});
