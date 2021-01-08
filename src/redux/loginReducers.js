const loginReducers = (prevState={}, action) => {
    switch(action.type){
        case 'SET_USER':
            return {
                ...action.payload.user
            }
        default:
            return prevState;
    }
}

export default loginReducers;