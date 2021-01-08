import { compose } from 'redux';
import { connect } from 'react-redux';
import { firestoreConnect, isEmpty, isLoaded } from 'react-redux-firebase';
import { Redirect } from 'react-router-dom';

import { Layout, Space, Typography, Steps, Row, Col, Button, message, Avatar, Card, Divider, List } from 'antd';
import { GoogleOutlined, CaretRightOutlined } from '@ant-design/icons';

import moment from 'moment';
import 'moment/locale/th';

const { Header, Footer, Content } = Layout;

// locale config
const localeConfigObj = {
    'J':'กฟต.1',
    'K':'กฟต.2',
    'L':'กฟต.3',
    'Z':'ภาค 4 (ภาพรวม)',
};

const Request = (props) => {
    const { userData, firebase, firestore } = props; 
    
    if (!isLoaded(props.userData)) {
        return <h3>Loading user data...</h3>;
    }

    if (!isLoaded(props.requestors)) {
        return <h3>Loading requestors data...</h3>;
    }

    if (!isLoaded(props.pathConfig)) {
        return <h3>Loading config data...</h3>;
    }

    if (isEmpty(props.requestors)) {
        return <h3>Empty requestors...</h3>;
    }

    if(isEmpty(props.userData)){
        return <Redirect to="/login" />
    }

    const requestorData = { ...props.requestors[userData.Username] };

    const loginWithGoogle = async () => {
        try {
            let authResult = await firebase.login({ provider: 'google', type: 'popup' })
            const { profile: { avatarUrl, displayName, email } } = authResult;
            await firestore.update({
                collection: 'requestors',
                doc: userData.Username
            }, {
                ...requestorData,
                isGmailAuth: true,
                gmailName: displayName,
                gmailAccount: email,
                gmailAvatarPath: avatarUrl,
                gmailAuthAt: new Date(),
                completedStep: 2
            });
            message.success('🥳 สำเร็จ ท่านได้ยืนยันบัญชี Gmail เพื่อเข้าดูข้อมูลสำคัญของสายงานเรียบร้อยแล้ว 🎉');
        } catch (error) {
            console.log('loginWithGoogle -> catch -> ', error);
        }
    }

    const renderReactNodeByGmailAuthCriteria = () => {
        if (!isLoaded(requestorData)) {
            return <h3>Loading...</h3>;
        }

        if (isEmpty(props.requestors)) {
            return <h3>Empty requestors...</h3>;
        }

        const gmailAuthAtObj = moment.unix(requestorData.gmailAuthAt.seconds)
        if(!requestorData.isGmailAuth){
            return (
                <>
                    <Button onClick={loginWithGoogle} danger>
                        <GoogleOutlined/> ยืนยันตัวตนผ่าน Gmail
                    </Button>
                </>
            )
        }

        return (
            <Card>
                <Space direction="vertical">
                    <Typography.Text level={3} strong>🎉 ยืนยันบัญชี Gmail เรียบร้อยแล้ว</Typography.Text>
                    <Typography.Text strong>
                        <Avatar src={requestorData.gmailAvatarPath} /> {requestorData.gmailName}
                    </Typography.Text>
                    <Typography.Text strong>บัญชี Gmail: {requestorData.gmailAccount}</Typography.Text>
                    <Typography.Text type="secondary">
                        เมื่อวันที่ {gmailAuthAtObj.locale('th').format('D MMMM YYYY, HH:mm:ss น.')}
                        ({gmailAuthAtObj.locale('th').fromNow()})
                    </Typography.Text>
                </Space>
            </Card>
        );
    }

    const createListOfDataStudioPath = () => {
        const pathConfig = props.pathConfig;
        const grantAffiliation = requestorData['grantAffiliation'];
        return grantAffiliation
                    .filter(affiliation => affiliation.isGranted)
                    .map(grantedAffiliation => (
                        <>
                            <List.Item.Meta
                                title={<Typography.Text strong><CaretRightOutlined /> {localeConfigObj[grantedAffiliation.district]}</Typography.Text>}
                            />
                            <Button type="primary" href={pathConfig[grantedAffiliation.district].dataStudioPath} target="_blank" >ลิงก์</Button>
                        </>                        
                    ));
                    
    }

    const renderReactNodeByPermissionApprove = () => {
        if(!requestorData.isGmailAuth && !requestorData.isApprovedPermission){
            return (
                <Card bordered>
                    <Typography.Text strong>
                        กรุณายืนยันตัวตนของท่านด้วยบัญชี Gmail ในขั้นตอนที่ 2
                    </Typography.Text>
                </Card>
            )
        }

        if(!requestorData.isApprovedPermission && requestorData.isGmailAuth) {
            return (
                <Card bordered>
                    <Typography.Text strong>
                        🏗️ กวศ.(ภ4) ได้รับข้อมูลของท่านเรียบร้อยแล้ว อยู่ระหว่างพิจารณาให้สิทธิ์, ขอบคุณครับ 🙂
                    </Typography.Text>
                </Card>
            )
        }
        if(requestorData.isApprovedPermission && requestorData.isGmailAuth) {
            return (
                <Card>
                    <Typography.Text strong>
                        🎉 ท่านได้รับการอนุมัติเรียบร้อยแล้ว
                    </Typography.Text>
                    <Divider dashed={true} style={{marginTop:5,marginBottom:10}} />
                    <Typography.Paragraph>
                        ท่านสามารถเข้าถึงข้อมูลสำคัญของสายงาน โดยใช้อีเมล์ {`${requestorData.gmailAccount}`} ที่ท่านลงทะเบียนไว้ เข้าสู่ระบบเพื่อติดตามสถานะข้อมูลในสังกัดดังนี้
                    </Typography.Paragraph>
                    <List
                        size="default"
                        dataSource={createListOfDataStudioPath()}
                        bordered
                        renderItem={item=>(
                            <List.Item>
                                {item}
                            </List.Item>
                        )}
                    >
                        
                    </List>
                </Card>
            );
        }
    }

    return (
        <>
            <Layout>
                <Header>
                    <Space direction="vertical">
                        <Typography.Title level={5} style={{ color:'white' }}>
                            ลงทะเบียนขอเข้าถึงข้อมูลสำคัญสายงาน
                        </Typography.Title>
                    </Space>
                </Header>
                <Content>
                    <Row justify={`center`} style={{marginTop: 30}}>
                        <Col span={18}>
                            <Steps direction="vertical" current={requestorData.completedStep}>    
                                <Steps.Step 
                                    title="ยืนยันตัวตนผ่าน IDM" 
                                    description="ท่านได้ยืนยันตัวตนผ่านระบบ IDM เรียบร้อยแล้ว" />
                                <Steps.Step 
                                    title="ยืนยันตัวตนผ่านบัญชี Gmail" 
                                    description={renderReactNodeByGmailAuthCriteria()} />

                                <Steps.Step 
                                    title="รอรับลิงก์เพื่อเข้าระบบฯ" 
                                    description={renderReactNodeByPermissionApprove()} />
                            </Steps>
                        </Col>
                    </Row>
                </Content>
                <Footer>
                    <Space>
                        <Typography.Text strong>
                            โดย ผบท.กวศ.(ภ4), โทร. 5140
                        </Typography.Text>
                    </Space>
                </Footer>
            </Layout>
        </>
    );
}

const enhance = compose(
    firestoreConnect(['requestors','pathConfig']),
    connect((state) => {
        return {
            userData: state.userData,
            requestors: state.firestore.data.requestors,
            pathConfig: state.firestore.data.pathConfig
        }
    }),
);

export default enhance(Request);