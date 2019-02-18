import React, { Component } from "react";
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator ,
  BackHandler,
  TextInput, 
  ImageStore,
  ToastAndroid,
  AsyncStorage
} from "react-native";
import { createMaterialTopTabNavigator } from 'react-navigation'

import MapView, { Circle } from 'react-native-maps';

import { Ionicons, Feather } from '@expo/vector-icons';

import { Camera, Permissions, Location } from 'expo';

import {
  createAppContainer
} from 'react-navigation';

import { Card, Image, Input, Divider, Text  } from 'react-native-elements'
import { Button } from "react-native-elements";

let USERNAME = ""
let PASSWORD = ""
let LOCATION = null

function getEmptyPost() {
  return {
    key:"-1",
    img:"https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/emojidex/112/shrug_1f937.png",
    title: "There doesn't seem to be anything here...",
    no_votes: true,
    location: {
      latitude: 37.78825,
      longitude: -122.4324,
    },
    radius: 50
  }
}

function POST(data, endpoint) {
  return fetch('http://52.90.56.155:8000' + endpoint, {
  method: 'POST',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'username': USERNAME, 
    'password': PASSWORD
  },
    body: JSON.stringify(data),
  });
}

function GET(endpoint) {
  console.log("Getting " + endpoint)
  return fetch('http://52.90.56.155:8000' + endpoint, {
  method: 'GET',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
  });
}

class Cam extends React.Component {
  state = {
    hasCameraPermission: null,
    type: Camera.Constants.Type.back,
    view: "Camera"
  };

  async componentDidMount() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ hasCameraPermission: status === 'granted' });
  }

  async takePhoto() {
    let photo = await this.camera.takePictureAsync()
    this.setState({photo: photo, location:LOCATION, view: "Edit"})
  }

  render() {
    if (this.state.view == "Camera") {
      const { hasCameraPermission } = this.state;
      if (hasCameraPermission === null) {
        return <View />;
      } else if (hasCameraPermission === false) {
        return <Text>No access to camera</Text>;
      } else {
        return (
          <View style={{ flex: 1 }}>
            <Camera style={{ flex: 1 }} type={this.state.type} ref={ref => { this.camera = ref; }}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  flexDirection: 'column',
                  alignItems: "center",
                  marginTop: 20,
                  marginRight: 5
                }}>
                <TouchableOpacity
                  style={{
                    flex: 2,
                    alignSelf: 'flex-end'
                  }}
                  onPress={() => {
                    this.setState({
                      type: this.state.type === Camera.Constants.Type.back
                        ? Camera.Constants.Type.front
                        : Camera.Constants.Type.back,
                    });
                  }}>
                  <Ionicons color="white" name="ios-reverse-camera" size={32}></Ionicons>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    marginBottom: 15
                  }}
                  onPress={() => {
                    this.takePhoto()
                  }}>
                  <Feather color="white" style={{alignItems:"center"}} name="circle" size={64}></Feather>
                </TouchableOpacity>
              </View>
            </Camera>
          </View>
        );
      }
    } else if (this.state.view == "Edit") {
      let button;
      if (this.state.posting)
        button = <ActivityIndicator />
      else
        button = <Button onPress={() => {this.post()}} style={{marginTop:25}} title="Post"></Button>
      BackHandler.addEventListener('hardwareBackPress', (e) => {
        this.setState({view: "Camera", photo:null, title: null, comment: null, tags: null, posting:null})
        return true
      })
      return (
        (
          <View style={{marginTop:20}}>
            <Card
              containerStyle={{padding: 0}}
              style={{flex:1}}
              image={{uri:this.state.photo.uri}}
              imageStyle={{height:250}}>
              <Input errorMessage={this.state.title_error} value={this.state.title} onChangeText={(val)=>{this.setState({title_error: null, title:val})}} placeholder="Title" />
              <Input value={this.state.tags} onChangeText={(val)=>{this.setState({tags:val})}} placeholder="Tags (Optional)" />
              <TextInput
                value={this.state.comment}
                onChangeText={(val)=>{this.setState({comment:val})}}
                multiline = {true}
                numberOfLines = {1}
                style={{borderRadius:3, borderBottomWidth:1,borderBottomColor: "#666666", marginVertical: 5, marginHorizontal:8, fontSize:16, paddingVertical: 4}}
                placeholder="Comment (Optional)">
              </TextInput>
              {button}
            </Card>
          </View>)
      )
    }
  }

  post() {
    if (!this.state.title) {
      this.setState({title_error: "Must enter a title!"})
      return
    }
    ImageStore.getBase64ForTag(this.state.photo.uri, (base64Data) => {
      let data = {location: this.state.location.coords, title: this.state.title, comment:this.state.comment, tags:this.state.tags, img:base64Data}
      this.setState({posting: true})
      POST(data, '/postMessage').then(() => {
        this.setState({view: "Camera", photo:null, title: null, comment: null, tags: null, posting:null})
      }, (err) => {
        ToastAndroid.show("Error connecting with server", ToastAndroid.SHORT)
        this.setState({posting: false})
      })
    }, (err) => {
      ToastAndroid.show("Critical error converting photo", ToastAndroid.SHORT)
      this.setState({view: "Camera", photo:null, title: null, comment: null, tags: null})
    })
  }
}


class FeedScreen extends Component {
  constructor(props) {
    super(props)
    this.state = {
      data: [],
      refreshing: true
    }
    console.log("feed")
  }

  componentDidMount() {
    console.log("mounted")
    this.init()
  }

  async init() {
    console.log("initing")
    this.setState({refreshing: true})
    GET(`/getMessages?latitude=${LOCATION.coords.latitude}&longitude=${LOCATION.coords.longitude}&num=10`).then((res) => {
      return res.json()}).then((res) => {
        console.log(res)
        let data = JSON.parse(res.body).map((v, i) => {return {...v, key:""+i}})
        if (data.length > 0)
          this.setState({data: data, refreshing: false})
        else
          this.setState({data: [getEmptyPost()], refreshing: false})
    }).catch((err) => {
      console.log(err)
      this.setState({data: [getEmptyPost()], refreshing: false})
      ToastAndroid.show("Error connecting to server", ToastAndroid.SHORT)
    });
  }

  render() {
    // if (this.state.data)
      return (
        <View >
          {/* <Button onPress={()=>{this.setState({data: null});this.init()}} title="Refresh"></Button> */}
          <FlatList
            style={{marginTop:15, marginBottom: 40}}
            data={this.state.data}
            renderItem={({item}) => {
              return (<Post data={item}></Post>)
            }}
            onRefresh={() => {this.init()}}
            refreshing={this.state.refreshing}
          />
        </View>
      );
    // else
    //   return (
    //     <ActivityIndicator size={100} style={{marginTop:300}}/>
    //   );
  }
}

class HomeScreen extends Component {
  render() {
    return (
      <View style={{flex: 1}}>
        <Cam style={{flex: 1}}></Cam>
      </View>
    );
  }
}

class Post extends Component {
  constructor(props) {
    super(props)
    if (!this.props.data.voted)
      this.props.data.voted = 0
    this.state = {voted: +this.props.data.voted}
    
  }

  render() {
    let item = this.props.data
    return (
      <Card 
        title={item.title}
        containerStyle={{padding: 0}}
        style={{flex:1}}
        image={{uri:item.img}}
        imageStyle={{height:250}}>
        {item.no_votes?<View />:(<View style={{flexDirection: "row"}}>
          <Ionicons color={this.state.voted==-1?"red":"black"} onPress={()=>{this.vote(-1)}} name="ios-thumbs-down" size={24}></Ionicons>
          <Text style={{flex:1, textAlign:"right", height: 24, paddingRight: 10, paddingTop: 3}}>{item.votes + this.state.voted}</Text>
          <Ionicons color={this.state.voted==1?"green":"black"} onPress={()=>{this.vote(1)}} name="ios-thumbs-up" size={24}></Ionicons>
        </View>)}
        {item.extra? <Text>{item.extra}</Text>: <View />}
        {item.comment? <Text>{item.comment}</Text>: <View />}
      </Card>)
  }

  vote(val) {
    this.setState((state) => {
      if (state.voted == val)
        return {voted: 0}
      return {voted: val}
    })
    POST({postID: this.props.data.id, voted:val},'/postVote')
    .then((res) => {
      console.log("vote", res)
    })
    .catch((err) => {
      console.log("err", err)
    })
  }
}

class SelfScreen extends Component {
  constructor(props) {
    super(props)
    this.state = {}
    this.state.current_i = 0
    this.state.data = [getEmptyPost()]
    this.state.refreshing = false
  }

  componentDidMount() {
    this.init()
  }

  async init() {
    GET(`/getMyMessages?username=${USERNAME}`).then((res) => {
      return res.json()}).then((res) => {
        console.log(res)
        let data = res.map((v, i) => {return {...v, key:""+i, no_votes:true, extra:"Score: "+v.votes}})
        if (data.length > 0) {
          console.log("setting region")
          this.setState({data: data, current_i: 0})
        }
        else
          this.setState({data: [getEmptyPost()], current_i: 0})
    }).catch((err) => {
      console.log(err)
      this.setState({data: [getEmptyPost()], current_i: 0})
      ToastAndroid.show("Error connecting to server", ToastAndroid.SHORT)
    });
  }
  
  onRegionChange(region) {
    this.setState({ region });
  }
  
  render() {
    return (
      <View style={{flex:1}}>
        <MapView
          scrollEnabled={false}
          zoomControlEnabled={false}
          region={{
              latitude: this.state.data[this.state.current_i].location.latitude,
              longitude: this.state.data[this.state.current_i].location.longitude,
              latitudeDelta: this.state.data[this.state.current_i].radius/20000,
              longitudeDelta: this.state.data[this.state.current_i].radius/20000
          }}
          onRegionChange={this.onRegionChange.bind(this)}
          style={{height:200}}>
          {this.state.data[this.state.current_i].location?<Circle strokeColor="#000" fillColor="rgba(255,0,0,.5)" center={{latitude:this.state.data[this.state.current_i].location.latitude, longitude:this.state.data[this.state.current_i].location.longitude}} radius={this.state.data[this.state.current_i].radius}></Circle>:<View />}
        </MapView>
        <View
          style={{flex:1}}>
          <View>
            <Ionicons style={{position:"absolute", left:8}} onPress={()=>{this.move(-1)}} size={20} name="ios-arrow-back"></Ionicons>
            <Text style={{position:"relative", left:170}} textAlign="center">{this.state.current_i+1}/{this.state.data.length}</Text>
            <Ionicons style={{position:"absolute", right:8}} onPress={()=>{this.move(1)}} size={20} name="ios-arrow-forward"></Ionicons>
          </View>
          <FlatList
              style={{flex:1, marginBottom:15}}
              data={[this.state.data[this.state.current_i]]}
              renderItem={({item}) => {
                return (<Post data={item}></Post>)
              }}
              onRefresh={() => {this.init()}}
              refreshing={this.state.refreshing} />
        </View>
      </View>
    );
    
  }

  move(amt) {
    this.setState(state => {
        return {current_i: (state.current_i + amt + state.data.length)%state.data.length};
    })
  }
}

const Nav = createMaterialTopTabNavigator({
  Discover: {
    screen: FeedScreen
  },
  Post: {
    screen: HomeScreen
  },
  Self: {
    screen: SelfScreen
  },
  // Settings: {
  //   screen: SettingsScreen
  // }
},
{
  tabBarPosition: "bottom",
  // swipeEnabled: false
});

// class SettingsScreen extends Component {
//   render()
// }

const NavComponent = createAppContainer(Nav);

export default class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      view: "Loading"
    }
  }

  async componentDidMount() {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      this.setState({
        view: "Failed"
      });
    } else {
      Location.watchPositionAsync({accuracy: Location.Accuracy.Highest}, (location) => {
        LOCATION = location
        this.setState({
          view: "Happy"
        })
      })
    }
  }
  render() {
    if (this.state.view == "Failed")
      return (
        <Card>
          <Text>This app requires Location Permission</Text>
          <Button onPress={async ()=>{
            let { status } = await Permissions.askAsync(Permissions.LOCATION);
            if (status !== 'granted') {
              this.setState({view: "Failed"});
            } else {
              this.setState({view: "Happy"})
            }
          }}>Enable</Button>
        </Card>
      )
    if (this.state.view == "Loading")
      return (
        <ActivityIndicator></ActivityIndicator>
      )
    
    if (this.state.loggedIn)
      return (
        <NavComponent out={(()=>{this.logout()}).bind(this)}></NavComponent>
      );
    
    return <Login auth={((u,p)=>{console.log("called");this.setState({loggedIn:true})}).bind(this)}></Login>
  }
}

class Login extends Component {
  constructor(props) {
    super(props)
    this.state = {
      user:"",
      pass:"",
      new_pass_1:"",
      new_pass_2:"",
      new_pass_error:"",
      new_user:""
    }
    // this._retrieveData()
  }

  _storeData = async () => {
    try {
      await AsyncStorage.setItem('cred', JSON.stringify({username:USERNAME, password:PASSWORD}));
    } catch (error) {
      // Error saving data
    }
  };

  _retrieveData = async () => {
    try {
      const value = await AsyncStorage.getItem('cred');
      if (value !== null) {
        let cred = JSON.parse(value)
        USERNAME = cred.username;
        PASSWORD = cred.password;
        this.login(cred.username, cred.password)
      }
    } catch (error) {
      // Error retrieving data
    }
  };

  login = (u, p) => {
    POST({username:u, password:p},"/login").then((res) => {
      if (!res.ok) {
        ToastAndroid.show("Invalid Credentials", ToastAndroid.SHORT)
        return
      }
      // this._storeData()
      this.props.auth()
    }).catch((err) => {
      USERNAME = ""
      PASSWORD = ""
    })
  }

  go() {
    console.log(this.state)
    if (this.state.new_pass_1 && this.state.new_pass_2 && this.state.new_user) {
      if (this.state.new_pass_1 != this.state.new_pass_2) {
        this.setState({new_pass_error: "Passwords must match!"})
        return
      }
      if (this.state.new_pass_1.length < 8) {
        this.setState({new_pass_error: "New password must be at least 8 characters!"})
        return
      }
      USERNAME=this.state.new_user;
      PASSWORD=this.state.new_pass_1;
      POST({username:this.state.new_user, password:this.state.new_pass_1},"/createUser").then((res) => {
        if (!res.ok) {
          ToastAndroid.show("Username Taken", ToastAndroid.SHORT)
          return
        }
        // this._storeData()
        this.props.auth()
      }).catch((err) => {
        USERNAME = ""
        PASSWORD = ""
      })
    } else if (this.state.user && this.state.pass) {
      USERNAME=this.state.user;
      PASSWORD=this.state.pass;
      this.login(this.state.user, this.state.pass)
    }
  }

  render() {
    return (
      <View style={{backgroundColor: "#0aa1ff", paddingTop: 80, flex:1}}>
        <Text h1 style={{textAlign:"center", color: "white", fontSize:128}}>Shout</Text>
        <Card containerStyle={{borderRadius:10, marginTop: 30}}>
          <Text h4 style={{textAlign:"center"}}>LOGIN</Text>
          <Input value={this.state.user} onChangeText={(val)=>{this.setState({user:val})}} placeholder="Username"></Input>
          <Input secureTextEntry={true} value={this.state.pass} onChangeText={(val)=>{this.setState({pass:val})}} placeholder="Password"></Input>
          <Text h4 style={{marginTop:30, textAlign:"center"}}>SIGN UP</Text>
          <Input value={this.state.new_user} onChangeText={(val)=>{this.setState({new_user:val})}} placeholder="Username"></Input>
          <Input secureTextEntry={true} value={this.state.new_pass_1} onChangeText={(val)=>{this.setState({new_pass_error:"", new_pass_1:val})}} placeholder="Password"></Input>
          <Input errorMessage={this.state.new_pass_error} secureTextEntry={true} value={this.state.new_pass_2} onChangeText={(val)=>{this.setState({new_pass_error:"", new_pass_2:val})}} placeholder="Confirm Password"></Input>
        </Card>
        <Button onPress={()=>{this.go()}} raised={true} buttonStyle={{borderRadius:10}} containerStyle={{margin: 15}} title="GO"></Button>
      </View>)
  }
}