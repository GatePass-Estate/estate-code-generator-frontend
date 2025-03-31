import React from 'react';
import { View, Text, Button, StyleSheet} from 'react-native';

const AddGuest = ({navigation}) => {
    return(
        <View style={styles.container}>
            <Text>Add Guest</Text>
            <Button
                title="click here"
                onPress={()=> alert('Button pressed')}
                />
        </View>
    );
};

export default AddGuest;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'green'
    }
})