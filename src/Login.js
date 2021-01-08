import React, { Component } from 'react';
import { Form, Input, Button, Row, Col, Alert, Card, Spin, Typography, Image } from 'antd';
import { Redirect } from 'react-router-dom';
import axios from 'axios';
import { connect } from 'react-redux';
import { setVerifiedUser } from './redux/loginAction';

import { idmAuthPath } from './constants';
import logo from './assets/logo_pea.jpg';

const layout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
};

const tailLayout = {
    wrapperCol: { offset: 8, span: 16 },
};

class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            data: {},
            loading: false,
            error: false,
            desc: '',
            verifiedUser: false
        }
    }

    onFinish =  async (values) => {
        this.setState(prevState => ({
            ...prevState,
            loading: true,
            error: false,
            desc: '',
            verifiedUser: false
        }));

        const { username: Username, password: Password } = values;
        const result = await axios.post(idmAuthPath, {
            Username,
            Password
        });
        const responseData = result.data
        // console.log(responseData);

        if(responseData.error) {
            this.setState(prevState => ({
                ...prevState, 
                data: {},
                loading: false,
                error: true,
                desc: responseData.desc
            }));
            return;
        }else{
            // set data to redux store
            this.props.setVerifiedUser({...responseData});

            // set state to Component state
            this.setState(prevState => ({
                ...prevState, 
                data: responseData,
                loading: false,
                error: false,
                desc: '',
                verifiedUser: true
            }));
            return;
        }
    };

    render(){
        let { loading, error, desc, verifiedUser, data: { FirstName, LastName, permission } } = this.state;

        if(verifiedUser){
            if(permission === "GRANTOR"){
                return <Redirect to='/manage' />;
            }else if(permission === "REQUESTOR"){
                return <Redirect to='/request' />;
            }
        }

        let container = (
            <div style={{ marginTop: '10px' }}>
                <Row>
                    <Col 
                        xs={{ span: 24 }} 
                        sm={{ span: 12, offset: 6 }}
                        md={{ span: 12, offset: 6 }}
                        lg={{ span: 12, offset: 6 }}
                        xl={{ span: 8, offset: 8}}
                        xxl={{ span: 6, offset: 9}}
                    >
                        <Card hoverable>
                        <Form
                            {...layout}
                            name="basic"
                            onFinish={this.onFinish}
                            onFinishFailed={this.onFinishFailed}
                        >
                            <div style={{ textAlign: 'center' }}>
                                <Image src={logo} width={100} preview={false} />
                                <Typography.Title level={5}>
                                    ระบบยืนยันตัวตนเข้าใช้งานระบบรายงานสถานะผลการดำเนินงานของสายงานการไฟฟ้าภาค 4
                                </Typography.Title>
                            </div>
                            { error ? 
                                (   
                                    <div style={{marginBottom: '20px'}}>
                                        <Alert message={desc} type="error" showIcon closable></Alert> 
                                    </div>
                                )
                                : 
                                null
                            }
                            {
                                verifiedUser && !error ? 
                                (
                                    <div style={{marginBottom: '20px'}}>
                                        <Alert message={`ยินดีต้อนรับคุณ${FirstName} ${LastName} เข้าสู่ระบบยืนยันตัวตน`} type="success" showIcon closable></Alert> 
                                    </div>
                                )
                                :
                                null
                            }
                            <Form.Item
                                label="รหัสพนักงาน"
                                name="username"
                                rules={[{ required: true, message: 'กรุณากรอกรหัสพนักงานของท่าน!' }]}
                            >
                                <Input placeholder="เช่น 505397, 505231, ..." autoComplete={'off'} />
                            </Form.Item>
                    
                            <Form.Item
                                label="รหัสผ่าน"
                                name="password"
                                rules={[{ required: true, message: 'กรุณากรอกรหัสผ่านเข้าเครื่องคอมพิวเตอร์!' }]}
                            >
                                <Input.Password />
                            </Form.Item>
                    
                            <Form.Item 
                            {...tailLayout}
                            >
                                <Button loading={this.state.loading} type="primary" htmlType="submit">
                                    เข้าสู่ระบบ
                                </Button>
                            </Form.Item>
                        </Form>
                        {/* <Typography.Text>
                            { JSON.stringify(this.state.data) }
                        </Typography.Text> */}
                        </Card>
                    </Col>
                </Row>
            </div>
        )

        return (
            <Spin spinning={loading}>
                {container}
            </Spin>
        );
    }
}

const mapDispatchToProps = dispatch => ({
    setVerifiedUser: (userData) => dispatch(setVerifiedUser(userData))
});

const enhance = connect(null, mapDispatchToProps);

export default enhance(Login);