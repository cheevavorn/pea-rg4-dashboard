import PropTypes from 'prop-types';
import { Redirect, Link, Switch, Route, useRouteMatch } from 'react-router-dom';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { firestoreConnect, isEmpty, isLoaded } from 'react-redux-firebase';

// ant design
import { Layout, Typography, Menu, Table, Avatar, Tag, Button, Radio, message, Space, Tooltip, Checkbox, Row, Col, Divider, Statistic } from 'antd';
import { UsergroupAddOutlined, LineChartOutlined, GoogleCircleFilled, CopyOutlined, FieldTimeOutlined, LogoutOutlined } from '@ant-design/icons';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import Config from './Config';

// third party libs
import moment from 'moment';
import 'moment/locale/th';

const { Header, Footer, Sider, Content } = Layout;

function Manage ({ requestors, userData, firestore }) {
    const { path } = useRouteMatch();

    if(isEmpty(userData)){
        return <Redirect to="/login" />
    }

    const columns = [
        {
            title: 'User profile(s)',
            dataIndex: 'gmailAvatarPath',
            // key: 'gmailAvatarPath',
            width: '10%',
            align: 'center',
            render: (avatarPath, record) => (
                <Space align="center" size="middle">
                    <Avatar.Group>
                        <Tooltip title="IDM Photo" color={'purple'}>
                            <Avatar 
                                src={`https://epi.pea.co.th/Images/${record.Username}.JPG`} 
                                size={55}/>
                        </Tooltip>
                        <Tooltip title="Google Avatar"color={'red'} >
                            <Avatar src={avatarPath} size={55} />
                        </Tooltip>
                    </Avatar.Group>
                </Space>
            )
        },
        {
        title: 'ชื่อ-นามสกุล',
        dataIndex: 'FirstName',
        //   key: 'gmailName',
        width: '15%',
        render: (text, record) => 
            <Space direction={'vertical'}>
                <Typography.Text strong>
                    <Tag color="#2db7f5">รหัสพนักงาน {`${record.Username}`}</Tag>
                </Typography.Text>
                <Typography.Text>
                    {`${record.TitleFullName}${record.FirstName} ${record.LastName}`}
                </Typography.Text>
            </Space>,
        },
        {
            title: 'ข้อมูลทั่วไป',
            dataIndex: 'CostCenterCode',
            width: '25%',
            filters: [
                {
                  text: 'ส่วนกลาง',
                  value: 'Z',
                },
                {
                  text: 'กฟต.1',
                  value: 'J',
                },
                {
                  text: 'กฟต.2',
                  value: 'K',
                },
                {
                  text: 'กฟต.3',
                  value: 'L',
                },
            ],
            filterMultiple: true,
            onFilter: (value, record) => record.CostCenterCode.charAt(0) === (value.charAt(0)),
            render: (text, record) => (
                <Space direction={'vertical'} size={5}> 
                    <Tag color="volcano">
                        {
                            record.CostCenterCode.startsWith('Z') ? 
                            'ส่วนกลาง':
                            record.CostCenterCode.startsWith('J') ?
                            'กฟต.1':
                            record.CostCenterCode.startsWith('K') ?
                            'กฟต.2':
                            record.CostCenterCode.startsWith('L')?
                            'กฟต.3':
                            'นอกเหนือจากส่วนกลาง และสามเขตภาคใต้'
                        }
                    </Tag>
                    <Typography.Text> 
                        <Typography.Text strong>สังกัด: </Typography.Text>
                        {`${record.DepartmentShort}`}
                    </Typography.Text>
                    <Typography.Text>
                        <Typography.Text strong>ตำแหน่ง: </Typography.Text>
                        {`${record.Position + ' ' + record.LevelDesc}`}
                    </Typography.Text>
                </Space>
            )
        },
        {
            title: 'บัญชี Gmail',
            dataIndex: 'gmailAccount',
            width: '20%',
            sorter: (a, b) => a.gmailAuthAt.seconds - b.gmailAuthAt.seconds,
            sortDirections: ['ascend', 'descend'],
            filters: [
                { text: 'ยืนยันผ่าน Gmail', value: 'authenticated'},
                { text: 'ยังไม่ได้ยืนยันผ่าน Gmail', value: null}
            ],
            onFilter: (value, record) => {
                if(value === "authenticated"){
                    return record.gmailName.trim().length > 0
                } else {
                    return record.gmailName.trim().length === 0 
                }
            },
            filterMultiple: false,
            render: (gmailAccount, record) => {
                if(!gmailAccount){
                    return <Tag color="error">อยู่ระหว่างยืนยันตัวตนผ่าน Google</Tag>;
                } else {
                    const gmailAuthAtObj = moment.unix(record.gmailAuthAt.seconds)
                    return (
                        <Space direction={'vertical'} size={5}> 
                            <Typography.Text strong>
                                <Typography.Title level={5}>
                                    <Space>
                                        {record.gmailName}  
                                        <Button 
                                            type="danger" 
                                            size={`small`}
                                            onClick={async ()=>{
                                                if(!window.confirm(`ท่านต้องการ Gmail บัญชี ${gmailAccount} ใช้หรือไม่`)){
                                                    message.info(`ท่านได้ยกเลิกการลบ Gmail บัญชี ${gmailAccount}`);
                                                    return;
                                                }

                                                await firestore.update({
                                                    collection: 'requestors',
                                                    doc: record.Username
                                                },{
                                                    ...record,
                                                    completedStep: 1,
                                                    gmailAccount: '',
                                                    gmailAuthAt: '',
                                                    gmailAvatarPath: '',
                                                    gmailName: '',
                                                    isGmailAuth: false,
                                                    isApprovedPermission: false
                                                })
                                                message.success(`ท่านได้ลบ Gmail บัญชี ${gmailAccount} เรียบร้อยแล้ว`);
                                                return;
                                            }}>
                                            ลบ Gmail นี้
                                        </Button>
                                    </Space>
                                </Typography.Title>
                            </Typography.Text>
                            <Typography.Text>
                                <Space>
                                    <>
                                        <GoogleCircleFilled style={{color:'#de5246'}} /> {gmailAccount} 
                                    </>
                                    <CopyToClipboard 
                                        text={gmailAccount} 
                                        onCopy={()=>message.success(`คัดลอกอีเมล์ ${gmailAccount} เรียบร้อยแล้ว 🎉`)}>
                                        <Button type="dashed" size="small" icon={<CopyOutlined/>}>คัดลอก</Button>
                                    </CopyToClipboard>
                                </Space>
                            </Typography.Text>
                            <Typography.Text>
                                <Space>
                                    <FieldTimeOutlined /> { gmailAuthAtObj.locale('th').format('D MMMM YYYY, HH:mm:ss น.') }
                                </Space>
                                <Space>
                                    <Typography.Text type="secondary">
                                        ({gmailAuthAtObj.locale('th').fromNow()})
                                    </Typography.Text>
                                </Space>
                            </Typography.Text>

                        </Space>
                    )
                }
            }
        },
        {
            title: "สิทธิ์การเข้าถึง",
            dataIndex: 'grantAffiliation',
            width: '15%',
            // filterMultiple: false,
            // filters: [
            //     { text: 'กฟต.1', value: 'J'},
            //     { text: 'กฟต.2', value: 'K'},
            //     { text: 'กฟต.3', value: 'L'},
            //     { text: 'ภาค 4', value: 'Z'},
            // ],
            // onFilter: (value, record) => {
            //     return record.grantAffiliation.filter(affiliation => {
            //         return affiliation.district === value && affiliation.isGranted
            //     }).length === 0 ? false : true;
            // },
            render: (affiliationList, record) => {
                return (
                    <Space direction={`vertical`} size={2}>
                        <Checkbox.Group 
                            options={[
                                { label: 'กฟต.1', value: 'J' },
                                { label: 'กฟต.2', value: 'K' },
                                { label: 'กฟต.3', value: 'L' },
                                { label: 'ภาค 4', value: 'Z' },
                            ]} 
                            onChange={async (selectedList) => {

                                const selectedAffiliation = ['J','K','L','Z']
                                                            .map(district => ({
                                                                district,
                                                                isGranted: selectedList.includes(district)
                                                            }))
                                try{
                                    await firestore.update({
                                        collection: 'requestors',
                                        doc: record.Username
                                    },{
                                        ...record,
                                        grantAffiliation: selectedAffiliation
                                    });
                                    message.success(`กำหนดสิทธิ์การเข้าถึงข้อมูลให้กับ ${record.TitleFullName+record.FirstName + ' ' + record.LastName} เรียบร้อยแล้ว`)
                                }catch(error){
                                    message.error('ไม่สามารถอัพเดทสังกัดในการเข้าถึงข้อมูลได้, กรุณาลองใหม่อีกครั้ง ');
                                }
                            }}
                            defaultValue={() => {
                                return affiliationList
                                        .filter(affiliation => affiliation.isGranted)
                                        .map(grantedAffiliation => grantedAffiliation.district)
                            }}
                        />
                    </Space>
                )
            }
        },
        {
            title: "สถานะการเข้าใช้งาน",
            width: '15%',
            dataIndex: 'isApprovedPermission',
            filters: [
                {text: 'เปิดสิทธิ์การเข้าถึงข้อมูล', value: true},
                {text: 'ระงับสิทธิ์การเข้าถึงข้อมูล', value: false}
            ],
            filterMultiple: false,
            onFilter: (value, record) => record.isApprovedPermission === value,
            render: (isApprovedPermission, record) => {
                return (
                    <Space direction={`vertical`}>
                        <Radio.Group 
                            name="permissionRadio" 
                            value={isApprovedPermission} 
                            onChange={async (e)=>{
                                if(!record.isGmailAuth) {
                                    message.warn(`ไม่สามารถเปิดสิทธิ์ได้เนื่องจาก ${record.TitleFullName + record.FirstName + ' ' + record.LastName} ไม่ได้ยืนยันตัวผ่านบัญชี Gmail`, 3)
                                    return;
                                }

                                try {
                                    let { value:checkedPermission } = e.target;
                                    await firestore
                                    .update({
                                        collection: 'requestors',
                                        doc: record.Username
                                    },{
                                        ...record,
                                        completedStep: checkedPermission ? 3 : 2,
                                        isApprovedPermission: checkedPermission
                                    })
                                    if(checkedPermission){
                                        message.success(`เปิดสิทธิ์การเข้าถึงข้อมูลให้กับ ${record.TitleFullName+record.FirstName + ' ' + record.LastName} เรียบร้อยแล้ว`)
                                    }else{
                                        message.warning(`ระงับสิทธิ์การเข้าถึงข้อมูลของ ${record.TitleFullName+record.FirstName + ' ' + record.LastName} เรียบร้อยแล้ว`)
                                    }
                                }catch(error){
                                    message.error('ไม่สามารถอัพเดทสิทธิ์ในการเข้าถึงข้อมูลได้, กรุณาลองใหม่อีกครั้ง ');
                                }
                            }}
                        >
                            <Radio value={true}>
                                <Typography.Text type={`success`} strong>เปิดสิทธิ์การเข้าถึงข้อมูล</Typography.Text>
                            </Radio>
                            <Radio value={false}>
                                <Typography.Text type={`danger`} strong>ระงับสิทธิ์การเข้าถึงข้อมูล</Typography.Text>
                            </Radio>
                        </Radio.Group>
                    </Space>
                )
            }
        }
    ];

    if (!isLoaded(requestors)) {
        return <span>Loading...</span>
    }
    
    return (
        <>
            <Layout>
                <Header>
                    <Space>
                        <Typography.Title style={{color:'white'}} level={3}>
                            ระบบยืนยันการเข้าถึงรายงานสถานะผลการดำเนินงานของสายงานการไฟฟ้า ภาค 4
                        </Typography.Title>
                    </Space>
                </Header>
                <Layout>
                    <Sider theme="light">
                        <Menu defaultSelectedKeys={`manage`}>
                            <Menu.Item key="manage" icon={<UsergroupAddOutlined />}>
                                <Link to="/manage">
                                    จัดการสิทธิ์
                                </Link>
                            </Menu.Item>
                            <Menu.Item key="config"  icon={<LineChartOutlined />}>
                                <Link to="/manage/config">
                                 ตั้งค่า
                                </Link>
                            </Menu.Item>
                            <Menu.Item key="logout"  icon={<LogoutOutlined />}>
                                <Link to="/login">
                                        ออกจากระบบ
                                </Link>
                            </Menu.Item>
                        </Menu>
                    </Sider>
                    <Content>
                        <Switch>
                            <Route exact path={path}>
                                <Row justify={`center`}>
                                    <Col span={23}>
                                        <Divider orientation="left">
                                            <Typography.Title level={3} strong>
                                                ข้อมูลทั่วไป
                                            </Typography.Title>
                                        </Divider>
                                    </Col>
                                </Row>
                                <Row justify={`center`}>
                                    <Col span={23} push={1}>
                                        <Typography.Title level={5} type="secondary">
                                            ยืนยันตัวตัวผ่าน IDM อย่างเดียว (ยังไม่ยืนยันตัวตนผ่านบัญชี Google)
                                        </Typography.Title>
                                    </Col>
                                </Row>
                                <Row justify={`center`} gutter={10}>
                                    <Col span={4}>
                                        <Statistic title="ล็อกอิน IDM อย่างเดียว" value={(()=>{
                                            if(!isLoaded(requestors)){
                                                return 'Loading...';
                                            }

                                            if(isEmpty(requestors)){
                                                return '0 คน';
                                            }

                                            return Object.keys(requestors)
                                            .map(employeeId => requestors[employeeId])
                                            .filter(requestor => !requestor.isGmailAuth).length + ' คน';
                                        })()} />
                                    </Col>
                                    <Col span={4}>
                                        <Statistic title="ภาค 4 (ส่วนกลาง)" value={(()=>{
                                            if(!isLoaded(requestors)){
                                                return 'Loading...';
                                            }

                                            if(isEmpty(requestors)){
                                                return '0 คน';
                                            }

                                            return Object.keys(requestors)
                                                         .map(employeeId => requestors[employeeId])
                                                         .filter(requestor => requestor.CostCenterCode.charAt(0) === 'Z' && !requestor.isGmailAuth).length + ' คน';
                                        })()} />
                                    </Col>
                                    <Col span={4}>
                                        <Statistic title="กฟต.1" value={(()=>{
                                            if(!isLoaded(requestors)){
                                                return 'Loading...';
                                            }

                                            if(isEmpty(requestors)){
                                                return '0 คน';
                                            }

                                            return Object.keys(requestors)
                                                         .map(employeeId => requestors[employeeId])
                                                         .filter(requestor => requestor.CostCenterCode.charAt(0) === 'J' && !requestor.isGmailAuth).length + ' คน';
                                        })()} />
                                    </Col>
                                    <Col span={4}>
                                        <Statistic title="กฟต.2" value={(()=>{
                                            if(!isLoaded(requestors)){
                                                return 'Loading...';
                                            }

                                            if(isEmpty(requestors)){
                                                return '0 คน';
                                            }

                                            return Object.keys(requestors)
                                                         .map(employeeId => requestors[employeeId])
                                                         .filter(requestor => requestor.CostCenterCode.charAt(0) === 'K' && !requestor.isGmailAuth).length + ' คน';
                                        })()} />
                                    </Col>
                                    <Col span={4}>
                                        <Statistic title="กฟต.3" value={(()=>{
                                            if(!isLoaded(requestors)){
                                                return 'Loading...';
                                            }

                                            if(isEmpty(requestors)){
                                                return '0 คน';
                                            }

                                            return Object.keys(requestors)
                                                         .map(employeeId => requestors[employeeId])
                                                         .filter(requestor => requestor.CostCenterCode.charAt(0) === 'L' && !requestor.isGmailAuth).length + ' คน';
                                        })()} />
                                    </Col>
                                </Row>
                                <Divider dashed style={{marginTop: 10, marginBottom: 10}} />
                                <Row justify={`center`}>
                                    <Col span={23} push={1}>
                                        <Typography.Title level={5} type="warning">
                                            ยืนยันตัวตัวผ่าน IDM && Google (รอยืนยันสิทธิ์)
                                        </Typography.Title>
                                    </Col>
                                </Row>
                                <Row justify={`center`} gutter={10}>
                                    <Col span={4}>
                                        <Statistic title="ล็อกอิน IDM && Google" value={(()=>{
                                            if(!isLoaded(requestors)){
                                                return 'Loading...';
                                            }

                                            if(isEmpty(requestors)){
                                                return '0 คน';
                                            }

                                            return Object.keys(requestors)
                                                .map(employeeId => requestors[employeeId])
                                                .filter(requestor => requestor.isGmailAuth && !requestor.isApprovedPermission).length + ' คน';
                                        })()} />
                                    </Col>
                                    <Col span={4}>
                                        <Statistic title="ภาค 4 (ส่วนกลาง)" value={(()=>{
                                            if(!isLoaded(requestors)){
                                                return 'Loading...';
                                            }

                                            if(isEmpty(requestors)){
                                                return '0 คน';
                                            }

                                            return Object.keys(requestors)
                                                         .map(employeeId => requestors[employeeId])
                                                         .filter(requestor => requestor.CostCenterCode.charAt(0) === 'Z' && requestor.isGmailAuth && !requestor.isApprovedPermission).length + ' คน';
                                        })()} />
                                    </Col>
                                    <Col span={4}>
                                        <Statistic title="กฟต.1" value={(()=>{
                                            if(!isLoaded(requestors)){
                                                return 'Loading...';
                                            }

                                            if(isEmpty(requestors)){
                                                return '0 คน';
                                            }

                                            return Object.keys(requestors)
                                                         .map(employeeId => requestors[employeeId])
                                                         .filter(requestor => requestor.CostCenterCode.charAt(0) === 'J' && requestor.isGmailAuth && !requestor.isApprovedPermission).length + ' คน';
                                        })()} />
                                    </Col>
                                    <Col span={4}>
                                        <Statistic title="กฟต.2" value={(()=>{
                                            if(!isLoaded(requestors)){
                                                return 'Loading...';
                                            }

                                            if(isEmpty(requestors)){
                                                return '0 คน';
                                            }

                                            return Object.keys(requestors)
                                                         .map(employeeId => requestors[employeeId])
                                                         .filter(requestor => requestor.CostCenterCode.charAt(0) === 'K' && requestor.isGmailAuth && !requestor.isApprovedPermission).length + ' คน';
                                        })()} />
                                    </Col>
                                    <Col span={4}>
                                        <Statistic title="กฟต.3" value={(()=>{
                                            if(!isLoaded(requestors)){
                                                return 'Loading...';
                                            }

                                            if(isEmpty(requestors)){
                                                return '0 คน';
                                            }

                                            return Object.keys(requestors)
                                                         .map(employeeId => requestors[employeeId])
                                                         .filter(requestor => requestor.CostCenterCode.charAt(0) === 'L' && requestor.isGmailAuth && !requestor.isApprovedPermission).length + ' คน';
                                        })()} />
                                    </Col>
                                </Row>
                                <Divider dashed style={{marginTop: 10, marginBottom: 10}} />
                                <Row justify={`center`}>
                                    <Col span={23} push={1}>
                                        <Typography.Title level={5} type="success">
                                            ยืนยันตัวตัวผ่าน IDM && Google (เปิดสิทธิ์แล้ว)
                                        </Typography.Title>
                                    </Col>
                                </Row>
                                <Row justify={`center`} gutter={10}>
                                    <Col span={4}>
                                        <Statistic title="ล็อกอิน IDM && Google" value={(()=>{
                                            if(!isLoaded(requestors)){
                                                return 'Loading...';
                                            }

                                            if(isEmpty(requestors)){
                                                return '0 คน';
                                            }

                                            return Object.keys(requestors)
                                                .map(employeeId => requestors[employeeId])
                                                .filter(requestor => requestor.isGmailAuth && requestor.isApprovedPermission).length + ' คน';
                                        })()} />
                                    </Col>
                                    <Col span={4}>
                                        <Statistic title="ภาค 4 (ส่วนกลาง)" value={(()=>{
                                            if(!isLoaded(requestors)){
                                                return 'Loading...';
                                            }

                                            if(isEmpty(requestors)){
                                                return '0 คน';
                                            }

                                            return Object.keys(requestors)
                                                         .map(employeeId => requestors[employeeId])
                                                         .filter(requestor => requestor.CostCenterCode.charAt(0) === 'Z' && requestor.isGmailAuth && requestor.isApprovedPermission).length + ' คน';
                                        })()} />
                                    </Col>
                                    <Col span={4}>
                                        <Statistic title="กฟต.1" value={(()=>{
                                            if(!isLoaded(requestors)){
                                                return 'Loading...';
                                            }

                                            if(isEmpty(requestors)){
                                                return '0 คน';
                                            }

                                            return Object.keys(requestors)
                                                         .map(employeeId => requestors[employeeId])
                                                         .filter(requestor => requestor.CostCenterCode.charAt(0) === 'J' && requestor.isGmailAuth && requestor.isApprovedPermission).length + ' คน';
                                        })()} />
                                    </Col>
                                    <Col span={4}>
                                        <Statistic title="กฟต.2" value={(()=>{
                                            if(!isLoaded(requestors)){
                                                return 'Loading...';
                                            }

                                            if(isEmpty(requestors)){
                                                return '0 คน';
                                            }

                                            return Object.keys(requestors)
                                                         .map(employeeId => requestors[employeeId])
                                                         .filter(requestor => requestor.CostCenterCode.charAt(0) === 'K' && requestor.isGmailAuth && requestor.isApprovedPermission).length + ' คน';
                                        })()} />
                                    </Col>
                                    <Col span={4}>
                                        <Statistic title="กฟต.3" value={(()=>{
                                            if(!isLoaded(requestors)){
                                                return 'Loading...';
                                            }

                                            if(isEmpty(requestors)){
                                                return '0 คน';
                                            }

                                            return Object.keys(requestors)
                                                         .map(employeeId => requestors[employeeId])
                                                         .filter(requestor => requestor.CostCenterCode.charAt(0) === 'L' && requestor.isGmailAuth && requestor.isApprovedPermission).length + ' คน';
                                        })()} />
                                    </Col>
                                </Row>
                                <Row justify={`center`}>
                                    <Col span={23}>
                                        <Divider orientation="left">
                                            <Typography.Title level={3} strong>
                                                ยืนยันสิทธิ์การเข้าใช้งาน
                                            </Typography.Title>
                                        </Divider>
                                    </Col>
                                </Row>
                                {/* <Row justify={'end'}>
                                    <Col>
                                        <Button type="primary" onClick={() => alert()} shape="round" icon={<DownloadOutlined />}>
                                            คัดลอกอีเมล์
                                        </Button>
                                    </Col>
                                </Row> */}
                                <Row justify={`center`}>
                                    <Col span={23}>
                                        <Table 
                                            bordered
                                            size={`middle`}
                                            sticky={true}
                                            loading={!isLoaded(requestors)}
                                            dataSource={ (isEmpty(requestors)) ? [] : Object.keys(requestors).map(requestor => requestors[requestor]) } 
                                            columns={columns}
                                            pagination={{ defaultPageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '15', '20']}}
                                            footer={() => (
                                                <></>)} />
                                    </Col>
                                </Row>
                            </Route>
                            <Route 
                                path={`${path}/config`} 
                                component={Config} />
                        </Switch>
                    </Content>
                </Layout>
                <Footer>
                    <Typography.Text strong>
                        โดย ผบท.กวศ.(ภ4)
                    </Typography.Text>
                </Footer>
            </Layout>
        </>
    );
}

const enhance = compose(
    firestoreConnect(['requestors']),
    connect((state) => ({
        requestors: state.firestore.data.requestors,
        userData: state.userData
    }))
);

Manage.propTypes = {
    requestors: PropTypes.object
};

export default enhance(Manage);