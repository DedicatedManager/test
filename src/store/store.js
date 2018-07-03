import Vue from 'vue';
import Vuex from 'vuex';
import firebase from 'firebase/app';
import router from '@/router';

Vue.use(Vuex);

export const store = new Vuex.Store({
    state:{
        user:null,
        userIsAuthenticated:false,
        QUERY_PrimaryRelativeCaregiverById:false,
        currentPrimaryRelativeCaregiver:null,
        currentPrimaryRelativeCaregivers:false,

    },
    mutations:{
        setUserIsAuthenticated(state, replace){
            state.userIsAuthenticated = replace;
        },
        setUser(state, replace){
            state.user = replace;
        },
        initialize_currentPrimaryRelativeCaregiver(state, PrimaryRelativeCaregiver){
            state.currentPrimaryRelativeCaregiver = PrimaryRelativeCaregiver;
        },
    },
    actions:{
        login(context, credentials){
            firebase.auth().signInWithEmailAndPassword(credentials.username, credentials.password)
            .then(data=>{
                console.log('Logged in.');
                router.push('/dashboard');
            })
            .catch(e=>{
                console.log('Login failed: ', e);
                alert(e.message)
            });  
        },
        logout(context){
            firebase.auth().signOut()
            .then(data=>{
              console.log('Logged out.');
              router.push('/login');
            })
            .catch(e=>{
              console.log('Logout failed: ', e);
            });
        },
        // Retrieve data from firebase
        getPrimaryRelativeCaregiverById(context, PrimaryRelativeCaregiverId){
            // If there is already a listener for this query, unsubscribe it
            if(context.state.QUERY_PrimaryRelativeCaregiverById){
                context.state.QUERY_PrimaryRelativeCaregiverById();
            }

            // Remove any old info so it is not shown prior to async call returning info
            context.commit('initialize_currentPrimaryRelativeCaregiver', null);

            // Create New
            if(PrimaryRelativeCaregiverId == "add"){
                context.dispatch('fcommit_PrimaryRelativeCaregiverById');
            }
            // Get existing
            else{
                // Set up the new query & listener
                context.state.QUERY_PrimaryRelativeCaregiverById = firebase.firestore().collection('PrimaryRelativeCaregiver').doc(PrimaryRelativeCaregiverId).onSnapshot(function(doc){
                    if(!doc.exists){
                        context.commit('initialize_currentPrimaryRelativeCaregiver', null);
                    }
                    // Only update if receiving new data from the firebase server. 
                    // - commits to firebase from our app will also call this listener and we can ignore since its just putting the data back where it came from
                    else if(!doc.metadata.hasPendingWrites){
                        context.commit('initialize_currentPrimaryRelativeCaregiver', {
                            id: PrimaryRelativeCaregiverId,
                            data: doc.data(),
                        })
                    }
                });            
            }
        },
        // update the local and remote storage for the caregiver
        update_currentPrimaryRelativeCaregiver_byObject(context, dataProperty){
            for (var key in dataProperty) {
                if (dataProperty.hasOwnProperty(key)) {
                    context.state.currentPrimaryRelativeCaregiver.data[key] = dataProperty[key];
                }
            };
            context.dispatch('fcommit_PrimaryRelativeCaregiverById');
        },
        // Commit changes to firebase
        fcommit_PrimaryRelativeCaregiverById(context){
            // Updating an entry
            if(context.state.currentPrimaryRelativeCaregiver && context.state.currentPrimaryRelativeCaregiver.hasOwnProperty('id') && context.state.currentPrimaryRelativeCaregiver.id){
                firebase.firestore().collection('PrimaryRelativeCaregiver').doc(context.state.currentPrimaryRelativeCaregiver.id).update(context.state.currentPrimaryRelativeCaregiver.data)
                .then(function() {
                    //console.log("Document successfully written!");
                })
                .catch(function(error) {
                    console.error("Error writing document: ", error);
                });    
            }
            // Creating a new entry
            else{
                console.log('creating new');
                firebase.firestore().collection('PrimaryRelativeCaregiver').add({})
                .then(function(docRef) {
                    context.dispatch('getPrimaryRelativeCaregiverById', docRef.id);
                    router.replace('/client/' + docRef.id);               
                })
                .catch(function(error) {
                    console.error("Error writing document: ", error);
                });    
            }
        },
        // Delete Client
        fdelete_PrimaryRelativeCaregiverById(context){
            firebase.firestore().collection('PrimaryRelativeCaregiver').doc(context.state.currentPrimaryRelativeCaregiver.id).delete()
                .then(function(docRef) {
                    router.replace('/dashboard');               
                })
                .catch(function(error) {
                    console.error("Error deleting document: ", error);
                }); 
        },

        getPrimaryRelativeCaregivers(context){
            firebase.firestore().collection('PrimaryRelativeCaregiver').get()
            .then(function(querySnapshot){
                let PrimaryRelativeCaregiverOBJ = {};
                querySnapshot.forEach(function(doc){
                    PrimaryRelativeCaregiverOBJ[doc.id] = doc.data();
                });
                context.state.currentPrimaryRelativeCaregivers=PrimaryRelativeCaregiverOBJ;
            })
            .catch(function(error) {
                console.error("Error retrieving clients: ", error);
            });
        },
    }
})