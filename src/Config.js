import { compose } from 'redux';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { firestoreConnect, isEmpty, isLoaded } from 'react-redux-firebase';

import { Col, Row, Divider, Typography, Form, Input, Button, Space, message } from 'antd';

const Config = (props) => {

    const [form] = Form.useForm();

    if (!isLoaded(props.requestors)) {
        return <span>Loading requestors data...</span>
    }
    if (!isLoaded(props.userData)) {
        return <span>Loading user data...</span>
    }
    if (!isLoaded(props.pathConfig)) {
        return <span>Loading pathConfig data...</span>
    }

    if(isEmpty(props.userData)){
        return <Redirect to="/login" />
    }

    const pathConfig = props.pathConfig; 
    const firestore = props.firestore;

    const createInitialValueObject = () => {
        const results = Object.keys(pathConfig)
                    .map(district => ({
                        district,
                        dataStudioPath: pathConfig[district].dataStudioPath,
                    }))
                    .reduce((initialValueObject, districtObject) => ({
                        ...initialValueObject,
                        [districtObject.district]: districtObject.dataStudioPath
                    }), {})
        return results;
    }

    const onSubmitForm = (updatedObjects) => {
        // send a request for update value
        Object.keys(updatedObjects).map(async district => {
            await firestore.update(`pathConfig/${district}`,{
                dataStudioPath: updatedObjects[district]
            });
        })
        message.success('อัพเดทที่อยู่ของ Google Data Studio ทั้งสามเขตและส่วนกลาง ภาค 4 เรียบร้อยแล้ว');
    }

    const formItemLayout = {
        labelCol: { span: 4 },
        wrapperCol: { span: 14 },
    };

    const buttonItemLayout = {
        wrapperCol: { span: 14, offset: 4 },
    };

    return (
        <>
            <Row justify={`center`}>
                <Col span={23}>
                    <Divider orientation="left">
                        <Typography.Title level={3} strong>
                            Google Data Studio path configurations
                        </Typography.Title>
                    </Divider>
                </Col>
            </Row>
            <Row>
                <Col span={23}>
                    <Form
                        {...formItemLayout}
                        layout={`horizontal`}
                        form={form}
                        initialValues={createInitialValueObject()}
                        onFinish={onSubmitForm}
                    >
                        <Form.Item name={'J'} label="Link Data studio กฟต.1">
                            <Input placeholder="https://datastudio.google.com/..." />
                        </Form.Item>
                        <Form.Item name={'K'} label="Link Data studio กฟต.2">
                            <Input placeholder="https://datastudio.google.com/..." />
                        </Form.Item>
                        <Form.Item name={'L'} label="Link Data studio กฟต.3">
                            <Input placeholder="https://datastudio.google.com/..." />
                        </Form.Item>
                        <Form.Item name={'Z'} label="Link Data studio ภาค 4">
                            <Input placeholder="https://datastudio.google.com/..." />
                        </Form.Item>
                        <Form.Item {...buttonItemLayout}>
                            <Space>
                                <Button type="primary" htmlType="submit">อัพเดทข้อมูล</Button>
                                {/* <Button type="reset">รีเซตค่าเดิม</Button> */}
                            </Space>
                        </Form.Item>
                    </Form>
                </Col>
            </Row>
        </>
    )
};

const enhance = compose(
    firestoreConnect(['requestors', 'pathConfig']),
    connect((state) => ({
        userData: state.userData,
        requestors: state.firestore.data.requestors,
        pathConfig: state.firestore.data.pathConfig
    }))
);

export default enhance(Config);